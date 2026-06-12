import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

interface RemotePeer {
  socketId: string;
  userName: string;
  stream: MediaStream;
}

/**
 * Mesh WebRTC room. Existing peers send offers to each newly-joined peer;
 * the newcomer answers. Signaling is relayed through the Socket.IO backend
 * (video:* events). Works for small groups (1:1 and a few participants).
 */
export const VideoCallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ?mode=audio joins without requesting the camera (voice call)
  const audioOnly = searchParams.get('mode') === 'audio';

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(!audioOnly);
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');

  const upsertPeer = useCallback((socketId: string, userName: string, stream: MediaStream) => {
    setRemotePeers((prev) => {
      const existing = prev.find((p) => p.socketId === socketId);
      if (existing) {
        return prev.map((p) => (p.socketId === socketId ? { ...p, stream, userName } : p));
      }
      return [...prev, { socketId, userName, stream }];
    });
  }, []);

  const removePeer = useCallback((socketId: string) => {
    const pc = peersRef.current.get(socketId);
    if (pc) {
      pc.close();
      peersRef.current.delete(socketId);
    }
    setRemotePeers((prev) => prev.filter((p) => p.socketId !== socketId));
  }, []);

  // Create (or reuse) a peer connection toward a given remote socket
  const createPeerConnection = useCallback(
    (remoteSocketId: string, remoteName: string) => {
      const existing = peersRef.current.get(remoteSocketId);
      if (existing) return existing;

      const socket = getSocket();
      const pc = new RTCPeerConnection(ICE_CONFIG);

      // Send our local tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('video:ice-candidate', {
            targetSocketId: remoteSocketId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        upsertPeer(remoteSocketId, remoteName, event.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
          removePeer(remoteSocketId);
        }
      };

      peersRef.current.set(remoteSocketId, pc);
      return pc;
    },
    [removePeer, upsertPeer]
  );

  useEffect(() => {
    if (!roomId || !user) return;
    const socket = getSocket();
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: !audioOnly, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatus('ready');

        // A new peer joined: we (an existing peer) initiate the offer
        socket.on('video:user-joined', async ({ socketId, userName }) => {
          const pc = createPeerConnection(socketId, userName);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('video:offer', { roomId, targetSocketId: socketId, offer });
        });

        // Received an offer: answer it
        socket.on('video:offer', async ({ from, userName, offer }) => {
          const pc = createPeerConnection(from, userName);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('video:answer', { targetSocketId: from, answer });
        });

        socket.on('video:answer', async ({ from, answer }) => {
          const pc = peersRef.current.get(from);
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('video:ice-candidate', async ({ from, candidate }) => {
          const pc = peersRef.current.get(from);
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {
              /* ignore late candidates */
            }
          }
        });

        socket.on('video:user-left', ({ socketId }) => removePeer(socketId));

        // Announce ourselves last, so handlers are registered first
        socket.emit('video:join-room', { roomId });
      } catch (err) {
        console.error(err);
        setStatus('error');
        toast.error('Could not access camera/microphone');
      }
    };

    start();

    return () => {
      cancelled = true;
      socket.emit('video:leave-room', { roomId });
      socket.off('video:user-joined');
      socket.off('video:offer');
      socket.off('video:answer');
      socket.off('video:ice-candidate');
      socket.off('video:user-left');
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user]);

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
      getSocket().emit('video:toggle', { roomId, kind: 'audio', enabled: track.enabled });
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
      getSocket().emit('video:toggle', { roomId, kind: 'video', enabled: track.enabled });
    }
  };

  const endCall = () => {
    navigate('/meetings');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Call link copied — share it to invite others');
  };

  if (!user) return null;

  // Grid sizing based on participant count
  const totalTiles = remotePeers.length + 1;
  const gridCols = totalTiles <= 1 ? 'grid-cols-1' : totalTiles <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 text-white">
        <div className="flex items-center gap-2">
          <Users size={20} />
          <span className="font-medium">{audioOnly ? 'Nexus Voice Call' : 'Nexus Call'}</span>
          <span className="text-sm text-gray-400">
            {totalTiles} participant{totalTiles > 1 ? 's' : ''}
          </span>
        </div>
        <Button size="sm" variant="ghost" className="text-white" leftIcon={<Copy size={16} />} onClick={copyRoomLink}>
          Copy invite link
        </Button>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-auto p-4">
        {status === 'error' ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <VideoOff size={48} className="mx-auto text-gray-500 mb-3" />
              <p className="text-white">Camera/microphone unavailable</p>
              <p className="text-gray-400 text-sm mt-1">
                Grant permission and reload, or rejoin from the meeting.
              </p>
            </div>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4 h-full`}>
            {/* Local tile */}
            <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-2xl text-white font-semibold">
                    {user.name.charAt(0)}
                  </div>
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-sm">
                You {!audioEnabled && '(muted)'}
              </span>
            </div>

            {/* Remote tiles */}
            {remotePeers.map((peer) => (
              <RemoteVideo key={peer.socketId} peer={peer} />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-6">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            audioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-error-500 hover:bg-error-700 text-white'
          }`}
          aria-label={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        {!audioOnly && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              videoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-error-500 hover:bg-error-700 text-white'
            }`}
            aria-label={videoEnabled ? 'Stop video' : 'Start video'}
          >
            {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        )}

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-error-500 hover:bg-error-700 text-white transition-colors"
          aria-label="End call"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
};

const RemoteVideo: React.FC<{ peer: RemotePeer }> = ({ peer }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = peer.stream;
  }, [peer.stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-sm">
        {peer.userName}
      </span>
    </div>
  );
};
