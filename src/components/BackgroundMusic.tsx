import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import './BackgroundMusic.css';

export default function BackgroundMusic() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Set initial volume lower for background ambiance
        audio.volume = 0.5;

        // Try to play automatically
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(() => {
                // Autoplay was prevented
                setIsPlaying(false);

                // Play on first user interaction (mouse move or touch)
                const handleFirstInteraction = () => {
                    audio.play().then(() => {
                        setIsPlaying(true);
                        document.removeEventListener('mousemove', handleFirstInteraction);
                        document.removeEventListener('touchstart', handleFirstInteraction);
                        document.removeEventListener('click', handleFirstInteraction);
                    }).catch(err => console.log("Still waiting for interaction..."));
                };

                document.addEventListener('mousemove', handleFirstInteraction);
                document.addEventListener('touchstart', handleFirstInteraction);
                document.addEventListener('click', handleFirstInteraction); // Keep click as ultimate fallback
            });
        }
    }, []);

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted) {
            audio.muted = false;
            setIsMuted(false);
            if (!isPlaying) {
                audio.play().then(() => setIsPlaying(true));
            }
        } else {
            audio.muted = true;
            setIsMuted(true);
        }
    };

    return (
        <div className="music-control-container">
            <audio ref={audioRef} loop>
                <source src="/bg.ogg" type="audio/ogg" />
                <source src="/bg.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>

            <button
                className={`music-toggle-btn ${isMuted ? 'muted' : ''}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute Music" : "Mute Music"}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className={isPlaying ? 'pulse-icon' : ''} />}
            </button>
        </div>
    );
}
