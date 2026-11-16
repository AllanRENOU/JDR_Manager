import { LARGE_VIDEO_BYTES } from '../../core/media/media-types';
import { MediaInfo } from '../../core/models';
import { aProject } from '../../../testing/data-builders';
import {
  ARCHIVE_FORMAT,
  ARCHIVE_VERSION,
  CollectedProject,
  DEFAULT_EXPORT_OPTIONS,
  archiveFileName,
  archiveMediaBytes,
  archiveMediaPath,
  buildArchive,
  isLargeVideo,
  isMediaIncluded,
} from './project-archive';

const image: MediaInfo = { id: 'm1', mimeType: 'image/png', size: 100, fileName: 'carte.png' };
const sound: MediaInfo = { id: 'm2', mimeType: 'audio/mpeg', size: 200, fileName: 'pluie.mp3' };
const video: MediaInfo = { id: 'm3', mimeType: 'video/mp4', size: 300, fileName: 'intro.mp4' };
const largeVideo: MediaInfo = {
  id: 'm4',
  mimeType: 'video/webm',
  size: LARGE_VIDEO_BYTES + 1,
  fileName: 'film.webm',
};

function collected(): CollectedProject {
  return {
    data: {
      project: aProject({ id: 'p1' }),
      sceneNodes: [],
      scenes: [],
      battlemaps: [],
      actions: [],
      sheetNodes: [],
      sheets: [],
      libraryNodes: [],
    },
    media: [image, sound, video, largeVideo],
  };
}

describe('project-archive', () => {
  it('repère les vidéos de plus de 500 Mo', () => {
    expect(isLargeVideo(largeVideo)).toBe(true);
    expect(isLargeVideo({ ...largeVideo, size: LARGE_VIDEO_BYTES })).toBe(false);
    expect(isLargeVideo({ ...image, size: LARGE_VIDEO_BYTES + 1 })).toBe(false);
  });

  it('par défaut, inclut tout sauf les vidéos de plus de 500 Mo (VID-13)', () => {
    expect(
      [image, sound, video, largeVideo].map((m) => isMediaIncluded(m, DEFAULT_EXPORT_OPTIONS)),
    ).toEqual([true, true, true, false]);
  });

  it('inclut les vidéos de plus de 500 Mo sur demande', () => {
    const options = { includeVideos: true, includeLargeVideos: true };
    expect(isMediaIncluded(largeVideo, options)).toBe(true);
  });

  it('sans « Inclure les vidéos », exclut toutes les vidéos mais garde images et sons', () => {
    const options = { includeVideos: false, includeLargeVideos: true };
    expect([image, sound, video, largeVideo].map((m) => isMediaIncluded(m, options))).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it('construit le JSON versionné avec les médias marqués inclus ou non', () => {
    const archive = buildArchive(
      collected(),
      DEFAULT_EXPORT_OPTIONS,
      new Date('2026-11-16T10:00:00.000Z'),
    );
    expect(archive).toMatchObject({
      format: ARCHIVE_FORMAT,
      version: ARCHIVE_VERSION,
      exportedAt: '2026-11-16T10:00:00.000Z',
    });
    expect(archive.data.project.id).toBe('p1');
    // Une vidéo exclue reste décrite (nom, type, taille) : elle sera créée sans fichier à l'import.
    expect(archive.media.find((m) => m.id === 'm4')).toEqual({ ...largeVideo, included: false });
  });

  it('compte le poids des seuls fichiers inclus', () => {
    expect(archiveMediaBytes(buildArchive(collected(), DEFAULT_EXPORT_OPTIONS))).toBe(600);
    expect(
      archiveMediaBytes(
        buildArchive(collected(), { includeVideos: false, includeLargeVideos: false }),
      ),
    ).toBe(300);
  });

  it('range chaque fichier sous medias/<id>.<extension>', () => {
    expect(archiveMediaPath(image)).toBe('medias/m1.png');
    expect(archiveMediaPath({ id: 'm5', mimeType: 'image/jpeg' })).toBe('medias/m5.jpg');
    expect(archiveMediaPath(sound)).toBe('medias/m2.mp3');
    expect(archiveMediaPath({ id: 'm6', mimeType: 'audio/mp4' })).toBe('medias/m6.m4a');
    expect(archiveMediaPath(largeVideo)).toBe('medias/m4.webm');
  });

  it('propose un nom de fichier sans caractères interdits', () => {
    expect(archiveFileName('La crypte oubliée')).toBe('La crypte oubliée.zip');
    expect(archiveFileName('Acte 1 : la fuite / suite?')).toBe('Acte 1 la fuite suite.zip');
    expect(archiveFileName('..cache')).toBe('cache.zip');
    expect(archiveFileName('  ')).toBe('projet.zip');
  });
});
