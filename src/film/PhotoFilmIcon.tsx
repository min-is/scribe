import IconFilm from '@/components/icons/IconFilm';

export default function PhotoFilmIcon({
  film,
  size = 14,
}: {
  film: string
  size?: number
}) {
  return <IconFilm size={size} title={film} />;
}
