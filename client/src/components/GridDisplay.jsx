import React, { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
];

const GridDisplay = ({ socket, code, videoEnabled, audioEnabled, username }) => {
  const [users, setUsers] = useState([]); // List of usernames in the room
  const [stream, setStream] = useState(null); // Your local media stream
  const videoRefs = useRef({}); // refs to video elements by username
  const peerConnections = useRef({}); // RTCPeerConnection instances keyed by username
  const remoteStreams = useRef({}); // Remote streams keyed by username
  const pendingCandidates = useRef({}); // ICE candidates received before remote description set

  // 1. Start or stop local media stream when toggles change
  useEffect(() => {
    const startStream = async () => {
      if (!videoEnabled && !audioEnabled) {
        if (stream) {
          console.log('Stopping local stream because both video and audio disabled');
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        return;
      }
      try {
        console.log('Requesting local media with:', { videoEnabled, audioEnabled });
        const media = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled,
        });
        setStream(media);
        if (videoRefs.current['self']) {
          videoRefs.current['self'].srcObject = media;
        }
        console.log('Local media stream started');
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    startStream();

    // Cleanup on unmount or toggles change
    return () => {
      if (stream) {
        console.log('Cleaning up local media stream');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoEnabled, audioEnabled]);

  // 2. Listen for updated user list from server
  useEffect(() => {
    if (!socket) return;

    const handleUpdateUsers = (userList) => {
      console.log('Received updated user list:', userList);
      setUsers(userList);
    };

    socket.on('update-users', handleUpdateUsers);

    return () => {
      socket.off('update-users', handleUpdateUsers);
    };
  }, [socket]);

  // 3. Manage peer connections when users or local stream changes
  useEffect(() => {
    if (!stream) return;

    console.log('Users updated, managing peer connections:', users);

    // Create peer connections for new users
    users.forEach(user => {
      if (user === username) return; // skip self
      if (!peerConnections.current[user]) {
        console.log(`Creating peer connection for: ${user}`);
        createPeerConnection(user, true);
      }
    });

    // Cleanup peer connections for users who left
    Object.keys(peerConnections.current).forEach(user => {
      if (!users.includes(user)) {
        console.log(`Closing peer connection for user who left: ${user}`);
        peerConnections.current[user].close();
        delete peerConnections.current[user];
        delete videoRefs.current[user];
        setUsers(prev => prev.filter(u => u !== user));
      }
    });
  }, [users, stream, username]);

  // 4. Create and manage RTCPeerConnection
  const createPeerConnection = (peerUsername, isInitiator) => {
    if (!stream) {
      console.warn('No local stream available, cannot create peer connection');
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnections.current[peerUsername] = pc;

    console.log(`Adding local tracks to peer connection for ${peerUsername}`);
    stream.getTracks().forEach(track => {
      console.log(`Adding ${track.kind} track`);
      pc.addTrack(track, stream);
    });

    // Handle remote stream tracks
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${peerUsername}`);
      const remoteStream = event.streams[0];
      remoteStreams.current[peerUsername] = remoteStream;
      const videoEl = videoRefs.current[peerUsername];
      if (videoEl) {
        videoEl.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates generated locally
    pc.onicecandidate = (event) => {
      console.log(`ICE candidate event for ${peerUsername}:`, event.candidate);
      if (event.candidate) {
        socket.emit('ice-candidate', {
          toUsername: peerUsername,
          candidate: event.candidate,
        });
      }
    };

    // Initiator starts offer/answer negotiation
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        console.log(`Negotiation needed for ${peerUsername}`);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(`Sending offer to ${peerUsername}`, offer);
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

  // 5. Listen to signaling messages and respond accordingly
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ fromUsername, offer }) => {
      console.log('Received offer from', fromUsername);
      if (!stream) {
        console.warn('No local stream - ignoring offer');
        return;
      }
      if (!peerConnections.current[fromUsername]) {
        console.log(`Creating peer connection for offer from ${fromUsername}`);
        createPeerConnection(fromUsername, false);
      }
      const pc = peerConnections.current[fromUsername];
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Add any queued ICE candidates for this peer
        if (pendingCandidates.current[fromUsername]) {
          for (const candidate of pendingCandidates.current[fromUsername]) {
            console.log(`Adding queued ICE candidate from ${fromUsername}`);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current[fromUsername] = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Sending answer to', fromUsername);
        socket.emit('answer', { toUsername: fromUsername, answer: pc.localDescription });
      } catch (err) {
        console.error('Error handling offer', err);
      }
    };

    const handleAnswer = async ({ fromUsername, answer }) => {
      console.log('Received answer from', fromUsername);
      const pc = peerConnections.current[fromUsername];
      if (!pc) {
        console.warn(`No peer connection for answer from ${fromUsername}`);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Add any queued ICE candidates
        if (pendingCandidates.current[fromUsername]) {
          for (const candidate of pendingCandidates.current[fromUsername]) {
            console.log(`Adding queued ICE candidate from ${fromUsername}`);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current[fromUsername] = [];
        }
      } catch (err) {
        console.error('Error handling answer', err);
      }
    };

    const handleIceCandidate = async ({ fromUsername, candidate }) => {
      console.log('Received ICE candidate from', fromUsername);
      const pc = peerConnections.current[fromUsername];
      if (!pc) {
        console.warn(`No peer connection for ICE candidate from ${fromUsername}`);
        return;
      }
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          console.log('Adding ICE candidate immediately');
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.log('Queuing ICE candidate until remote description is set');
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
      {/* Your own video */}
      <div className="bg-white p-2 rounded-2xl text-center shadow-xl">
        <video
          ref={el => videoRefs.current['self'] = el}
          autoPlay
          muted
          playsInline
          className="w-full h-auto"
        />
        <div>{username} (You)</div>
      </div>

      {/* Other users' videos */}
      {users.filter(u => u !== username).map(user => (
        <div key={user} className="bg-white p-2 rounded-2xl text-center shadow-xl">
          <video
            ref={el => {
              if (el) {
                videoRefs.current[user] = el;
                if (remoteStreams.current[user]) {
                  el.srcObject = remoteStreams.current[user];
                }
              } else {
                delete videoRefs.current[user];
              }
            }}
            autoPlay
            playsInline
            className="w-full h-auto"
          />
          <div>{user}</div>
        </div>
      ))}
    </div>
  );
};

export default GridDisplay;
