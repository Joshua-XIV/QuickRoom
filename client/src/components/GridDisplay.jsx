import React, { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
];

const GridDisplay = ({ socket, code, videoEnabled, audioEnabled, username }) => {
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const videoRefs = useRef({});
  const peerConnections = useRef({});
  const remoteStreams = useRef({});
  const pendingCandidates = useRef({});
  const [userStates, setUserStates] = useState({});

  useEffect(() => {
    const startStream = async () => {
      try {
        // Stop existing stream if disabling both video and audio
        if (!videoEnabled && !audioEnabled) {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
          // Notify others that your media is off
          if (socket) {
            socket.emit('media-state', {
              username,
              videoEnabled: false,
              audioEnabled: false,
            });
          }
          return;
        }

        const mediaConstraints = {};
        if (videoEnabled) mediaConstraints.video = true; else mediaConstraints.video = false
        if (audioEnabled) mediaConstraints.audio = true;

        console.log("Requesting media with:", mediaConstraints);
        const media = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        console.log("Got tracks:", media.getTracks());

        setStream(media);
        if (videoRefs.current['self']) {
          videoRefs.current['self'].srcObject = media;
        }

        if (socket) {
          socket.emit('media-state', {
            username,
            videoEnabled,
            audioEnabled,
          });
        }

      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoEnabled, audioEnabled, socket, username]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdateUsers = (userList) => {
      setUsers(userList);

      setUserStates(prev => {
        const newStates = { ...prev };
        userList.forEach(user => {
          if (!newStates[user]) {
            newStates[user] = {
              hasVideo: false,
              hasAudio: false
            };
          }
        });
        return newStates;
      });
    };

    socket.on('update-users', handleUpdateUsers);
    return () => {
      socket.off('update-users', handleUpdateUsers);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMediaState = ({ username, videoEnabled, audioEnabled }) => {
      setUserStates(prev => ({
        ...prev,
        [username]: {
          hasVideo: videoEnabled,
          hasAudio: audioEnabled
        }
      }));
    };

    socket.on('media-state', handleMediaState);
    return () => {
      socket.off('media-state', handleMediaState);
    };
  }, [socket]);

  useEffect(() => {
    // Create or remove peer connections as users come and go
    users.forEach(user => {
      if (user === username) return;
      if (!peerConnections.current[user]) {
        createPeerConnection(user, true);
      }
    });

    Object.keys(peerConnections.current).forEach(user => {
      if (!users.includes(user)) {
        peerConnections.current[user].close();
        delete peerConnections.current[user];
        delete videoRefs.current[user];
        delete remoteStreams.current[user];
      }
    });

    // Update peer connections with latest local tracks (if any)
    if (stream) {
      Object.values(peerConnections.current).forEach(pc => {
        const currentTracks = stream.getTracks();
        const senders = pc.getSenders();

        senders.forEach(s => {
          if (s.track && !currentTracks.includes(s.track)) {
            pc.removeTrack(s);
          }
        });

        const existingTracks = senders.map(s => s.track);
        currentTracks.forEach(track => {
          if (!existingTracks.includes(track)) {
            pc.addTrack(track, stream);
          }
        });
      });
    }
  }, [users, stream, username]);

  const createPeerConnection = (peerUsername, isInitiator) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnections.current[peerUsername] = pc;

    // Add local tracks if available
    if (stream) {
      const existingTracks = pc.getSenders().map(s => s.track);
      stream.getTracks().forEach(track => {
        if (!existingTracks.includes(track)) {
          pc.addTrack(track, stream);
        }
      });
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      remoteStreams.current[peerUsername] = remoteStream;

      setUserStates(prev => ({
        ...prev,
        [peerUsername]: {
          hasVideo: remoteStream.getVideoTracks().length > 0,
          hasAudio: remoteStream.getAudioTracks().length > 0
        }
      }));

      const videoEl = videoRefs.current[peerUsername];
      if (videoEl) {
        videoEl.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          toUsername: peerUsername,
          candidate: event.candidate,
        });
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          // Create offer even if no local tracks
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            toUsername: peerUsername,
            offer: pc.localDescription,
          });
        } catch (err) {
          console.error('Error during negotiation', err);
        }
      };
    }

    return pc;
  };

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ fromUsername, offer }) => {
      if (!peerConnections.current[fromUsername]) {
        createPeerConnection(fromUsername, false);
      }
      const pc = peerConnections.current[fromUsername];
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        if (pendingCandidates.current[fromUsername]) {
          for (const candidate of pendingCandidates.current[fromUsername]) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current[fromUsername] = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { toUsername: fromUsername, answer: pc.localDescription });
      } catch (err) {
        console.error('Error handling offer', err);
      }
    };

    const handleAnswer = async ({ fromUsername, answer }) => {
      const pc = peerConnections.current[fromUsername];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        if (pendingCandidates.current[fromUsername]) {
          for (const candidate of pendingCandidates.current[fromUsername]) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current[fromUsername] = [];
        }
      } catch (err) {
        console.error('Error handling answer', err);
      }
    };

    const handleIceCandidate = async ({ fromUsername, candidate }) => {
      const pc = peerConnections.current[fromUsername];
      if (!pc) return;
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!pendingCandidates.current[fromUsername]) {
            pendingCandidates.current[fromUsername] = [];
          }
          pendingCandidates.current[fromUsername].push(candidate);
        }
      } catch (err) {
        console.error('Error adding received ICE candidate', err);
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, stream]);

  return (
    <div className="w-full h-full bg-black/85 border-2 border-amber-500 p-4 grid grid-cols-2 gap-4 overflow-y-auto">
      <div className="bg-white p-2 rounded-2xl text-center shadow-xl">
        {videoEnabled ? (
          <video
            ref={el => videoRefs.current['self'] = el}
            autoPlay
            muted
            playsInline
            className="w-full h-auto"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Video Off</span>
          </div>
        )}
        <div>{username} (You)</div>
        <div className="text-sm text-gray-600">
          {videoEnabled ? 'Video: On' : 'Video: Off'} | {audioEnabled ? 'Audio: On' : 'Audio: Off'}
        </div>
      </div>

      {users.filter(u => u !== username).map(user => (
        <div key={user} className="bg-white p-2 rounded-2xl text-center shadow-xl">
          <video
            ref={el => {
              if (el) {
                videoRefs.current[user] = el;
                if (remoteStreams.current[user]) {
                  el.srcObject = remoteStreams.current[user];
                }
              }
            }}
            autoPlay
            playsInline
            className="w-full h-auto"
            style={{ backgroundColor: userStates[user]?.hasVideo ? 'transparent' : 'black' }}
          />
          <div>{user}</div>
          <div className="text-sm text-gray-600">
            {userStates[user]?.hasVideo !== undefined 
              ? (userStates[user]?.hasVideo ? 'Video: On' : 'Video: Off')
              : 'Loading...'} | 
            {userStates[user]?.hasAudio !== undefined
              ? (userStates[user]?.hasAudio ? ' Audio: On' : ' Audio: Off')
              : 'Loading...'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridDisplay;
