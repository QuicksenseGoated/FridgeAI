import type { YouTubeVideo } from "../types/scan";

interface VideoCardProps {
  video: YouTubeVideo;
  compact?: boolean;
}

export function VideoCard({ video, compact = false }: VideoCardProps) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className={`video-card${compact ? " video-card--compact" : ""}`}
    >
      <div className="video-card__media">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" className="video-card__thumb" />
        ) : (
          <div className="video-card__thumb video-card__thumb--empty" />
        )}
        <span className="video-card__play" aria-hidden>
          ▶
        </span>
        {video.duration && (
          <span className="video-card__duration">{video.duration}</span>
        )}
      </div>
      <div className="video-card__body">
        <strong className="video-card__title">{video.title}</strong>
        <span className="video-card__channel">{video.channelTitle}</span>
        <span className="video-card__cta">Watch on YouTube</span>
      </div>
    </a>
  );
}
