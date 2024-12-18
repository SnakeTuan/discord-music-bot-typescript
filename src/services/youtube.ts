// youtube.ts
import { youtubePlaylistRegex, youtubeVideoRegex } from '../collections/regex';
import { Playlist } from '../types/playlist';
import { Platform, Song } from '../types/song';
import ytdl from "@distube/ytdl-core";
import ytpl from 'ytpl';
import ytsr, { Video } from '@distube/ytsr';

export class YoutubeService {
  public static async getVideoDetails(content: string): Promise<Song> {
    console.log("get video details: ", content);
    const parsedContent = content.match(youtubeVideoRegex);
    let id = '';
    if (!parsedContent) {
      const result = await this.searchVideo(content);
      if (!result) throw new Error();
      id = result;
    } else {
      id = parsedContent[1];
    }
    const videoUrl = this.generateVideoUrl(id);
    const result = await ytdl.getInfo(videoUrl);
    return {
      title: result.videoDetails.title,
      length: parseInt(result.videoDetails.lengthSeconds, 10),
      author: result.videoDetails.author.name,
      thumbnail:
        result.videoDetails.thumbnails[
          result.videoDetails.thumbnails.length - 1
        ].url,
      url: videoUrl,
      platform: Platform.YOUTUBE,
    };
  }

  public static async getPlaylist(url: string): Promise<Playlist> {
    console.log("get playlist with this url: ", url);
    const id = url.split('?')[1].split('=')[1];
    const playlist = await ytpl(id);
    const songs: Song[] = [];
    playlist.items.forEach((item) => {
      songs.push({
        title: item.title,
        thumbnail: item.bestThumbnail.url || '',
        author: item.author.name,
        url: item.shortUrl,
        length: item.durationSec || 0,
        platform: Platform.YOUTUBE,
      });
    });

    return {
      title: playlist.title,
      thumbnail: playlist.bestThumbnail.url || '',
      author: playlist.author.name,
      songs,
    };
  }

  private static async searchVideo(keyword: string): Promise<string> {
    console.log("search video with keyword: ", keyword);
    const result = await ytsr(keyword, { limit: 1 });
    const filteredRes = result.items.filter((item) => item.type === 'video');
    if (filteredRes.length === 0) throw new Error();
    const item = filteredRes[0] as Video;
    return item.id;
  }

  public static isPlaylist(url: string): string | null {
    console.log("check if it is playlist with url: ", url);
    const paths = url.match(youtubePlaylistRegex);
    if (paths) return paths[0];
    return null;
  }

  private static generateVideoUrl(id: string) {
    console.log("generate video url with id: ", id);
    return `https://www.youtube.com/watch?v=${id}`;
  }
}
