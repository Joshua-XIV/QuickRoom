import React, { useEffect, useRef, useState } from 'react';

const GridDisplay = ({ socket, code, videoEnabled, audioEnabled, username }) => {
  const [users, setUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const videoRefs = useRef({});

  // Start or stop local media stream based on video/audio toggles
  useEffect(() => {
    const startStream = async () => {
      if (!videoEnabled && !audioEnabled) {
        // If both disabled, stop existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled,
        });
        setStream(media);

        if (videoRefs.current['self']) {
          videoRefs.current['self'].srcObject = media;
        }
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    startStream();

    // Cleanup on unmount: stop all tracks
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoEnabled, audioEnabled]);



  // Enable or disable tracks when toggles change
  useEffect(() => {
    if (!stream) return;

    stream.getVideoTracks().forEach(track => {
      track.enabled = videoEnabled;
    });

    stream.getAudioTracks().forEach(track => {
      track.enabled = audioEnabled;
    });
  }, [videoEnabled, audioEnabled, stream]);

  return (
    <div className='w-full h-full bg-black/85 border-2 border-amber-500 p-4 grid grid-cols-2 gap-4 overflow-y-auto'>
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

      {/* Remote users' videos */}
      {users.map(user => (
        <div key={user} className="bg-white p-2 rounded-2xl text-center shadow-xl">
          <video
            ref={el => videoRefs.current[user] = el}
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
