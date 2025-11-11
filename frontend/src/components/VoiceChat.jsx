import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const VoiceChat = ({ gameId, players }) => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  useEffect(() => {
    if (!socket) return;

    // WebRTC Configuration
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    };

    // Get local audio stream
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        localStreamRef.current = stream;
        setIsConnected(true);

        // Create peer connections for each other player
        players.forEach((player) => {
          if (player.user_id !== user.id) {
            createPeerConnection(player.user_id, configuration, stream);
          }
        });
      })
      .catch((error) => {
        console.error('Failed to get audio stream:', error);
        alert(t('voiceChatError'));
      });

    // Socket listeners for WebRTC signaling
    socket.on('webrtc-offer', async ({ offer, fromUserId }) => {
      const pc = peerConnectionsRef.current[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          gameId,
          answer,
          targetUserId: fromUserId,
        });
      }
    });

    socket.on('webrtc-answer', async ({ answer, fromUserId }) => {
      const pc = peerConnectionsRef.current[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate, fromUserId }) => {
      const pc = peerConnectionsRef.current[fromUserId];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
    };
  }, [socket, gameId, players, user]);

  const createPeerConnection = (targetUserId, configuration, stream) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnectionsRef.current[targetUserId] = pc;

    // Add local stream to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          gameId,
          candidate: event.candidate,
          targetUserId,
        });
      }
    };

    // Create and send offer
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        if (socket) {
          socket.emit('webrtc-offer', {
            gameId,
            offer: pc.localDescription,
            targetUserId,
          });
        }
      })
      .catch(error => console.error('Error creating offer:', error));
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6" data-testid="voice-chat">
      <h3 className="text-xl font-bold text-white mb-4">{t('voiceChat')}</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} data-testid="connection-status"></div>
          <span className="text-gray-300">
            {isConnected ? t('connected') : t('disconnected')}
          </span>
        </div>

        <button
          onClick={toggleMute}
          disabled={!isConnected}
          className={`px-6 py-2 rounded font-semibold transition disabled:opacity-50 ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          data-testid="mute-button"
        >
          {isMuted ? t('unmute') : t('mute')}
        </button>
      </div>
    </div>
  );
};

export default VoiceChat;
