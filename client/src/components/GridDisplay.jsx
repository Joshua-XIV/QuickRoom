import React, { useEffect, useRef, useState } from 'react';

// Should do a lot of this logic with local media devices outside the room probably for future

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
];

// Aspect ratio constants (16:9)? Maybe works
const ASPECT_RATIO = 16 / 9;
const PADDING_BOTTOM = `${100 / ASPECT_RATIO}%`;

const GridDisplay = ({ socket, videoEnabled, audioEnabled, username }) => {
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const videoRefs = useRef({});
  const peerConnections = useRef({});
  const remoteStreams = useRef({});
  const pendingCandidates = useRef({});
  const [userStates, setUserStates] = useState({});
  const [gridCols, setGridCols] = useState(2);
  const gridContainerRef = useRef(null);

  // Attempt to calculate grid columns based on container width and number of users
  useEffect(() => {
    const updateGridLayout = () => {
      if (!gridContainerRef.current) return;
      
      const containerWidth = gridContainerRef.current.offsetWidth;
      const minTileWidth = 300;
      const numUsers = Math.max(1, users.length);
      
      const maxCols = Math.max(1, Math.floor(containerWidth / minTileWidth));
      const balancedCols = Math.ceil(Math.sqrt(numUsers));
      
      const cols = Math.min(maxCols, balancedCols);
      
      setGridCols(cols);
    };

    updateGridLayout();
    window.addEventListener('resize', updateGridLayout);
    
    return () => {
      window.removeEventListener('resize', updateGridLayout);
    };
  }, [users.length]);

  useEffect(() => {
    const startStream = async () => {
      try {
        const mediaConstraints = {};
        mediaConstraints.video = videoEnabled;
        mediaConstraints.audio = audioEnabled;
        let media = null;
        console.log("Requesting media with:", mediaConstraints);
        // only get user media if one of them is enabled
        if (videoEnabled || audioEnabled) {
          media = await navigator.mediaDevices.getUserMedia(mediaConstraints);
          console.log("Got tracks:", media.getTracks());
        }

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

        if (!videoEnabled) {
          if (stream) {
            stream.getVideoTracks().forEach(track => track.stop());
          }
          // Notify others that your media is off
          if (socket) {
            socket.emit('media-state', {
              username,
              videoEnabled: false,
              audioEnabled: audioEnabled,
            });
          }
        }

        if (!audioEnabled) {
          if (stream) {
            stream.getAudioTracks().forEach(track => track.stop());
          }
          // Notify others that your media is off
          if (socket) {
            socket.emit('media-state', {
              username,
              videoEnabled: videoEnabled,
              audioEnabled: false,
            });
          }
        }

        if (!videoEnabled && !audioEnabled) {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (socket) {
            socket.emit('media-state', {
              username,
              videoEnabled: false,
              audioEnabled: false,
            });
          }
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

    // Attempt to update peer connections with latest local tracks
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

  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      console.log('GridDisplay mount/unmount?');
      console.log(streamRef.current); // should be null at first
      if (streamRef.current) {
        console.log('Hello');  // should be logging when inside
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      // Also close all peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      remoteStreams.current = {};
      videoRefs.current = {};
    };
  }, []);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  return (
    <div 
      ref={gridContainerRef}
      className="w-full h-screen bg-black/85 border-2 border-amber-500 p-4 overflow-y-auto"
    >
      <div 
        className="grid gap-4 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridAutoRows: '1fr',
        }}
      >
        {/* Self video */}
        <div className="bg-white p-2 rounded-2xl text-center shadow-xl flex flex-col">
          <div className="relative" style={{ paddingBottom: PADDING_BOTTOM }}>
            {videoEnabled ? (
              <video
                ref={el => videoRefs.current['self'] = el}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Video Off</span>
              </div>
            )}
          </div>
          <div className="mt-2 font-medium">{username} (You)</div>
          <div className="text-sm text-gray-600">
            {videoEnabled ? 'Video: On' : 'Video: Off'} | {audioEnabled ? 'Audio: On' : 'Audio: Off'}
          </div>
        </div>

        {/* Other users */}
        {users.filter(u => u !== username).map(user => (
          <div key={user} className="bg-white p-2 rounded-2xl text-center shadow-xl flex flex-col">
            <div className="relative" style={{ paddingBottom: PADDING_BOTTOM }}>
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
                className={`absolute top-0 left-0 w-full h-full ${
                  userStates[user]?.hasVideo ? 'object-cover' : 'bg-gray-200'
                }`}
              />
              {!userStates[user]?.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-500">Video Off</span>
                </div>
              )}
            </div>
            <div className="mt-2 font-medium">{user}</div>
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
    </div>
  );
};

export default GridDisplay;