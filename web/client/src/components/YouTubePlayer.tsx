import React from 'react';

interface YouTubePlayerProps {
    videoId: string;
    title?: string;
    autoplay?: boolean;
}

/**
 * YouTube Video Player Component
 * Embeds YouTube video with responsive aspect ratio
 */
const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
    videoId,
    title = 'Video bài học',
    autoplay = false
}) => {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`;

    return (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
            <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
            />
        </div>
    );
};

export default YouTubePlayer;
