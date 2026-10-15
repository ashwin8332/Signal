import type { ContentItem } from '@/types/content';
import type { MovieGenre } from '@/lib/constants';
import { between, createRandom, mockImage, pick } from './random';

export const MOCK_MOVIES_PER_GENRE = 36;

interface GenreCorpus {
  first: string[];
  second: string[];
  loglines: string[];
}

// Fictional titles assembled from word lists, with one-sentence loglines.
const CORPUS: Record<MovieGenre, GenreCorpus> = {
  action: {
    first: ['Iron', 'Last', 'Silent', 'Rogue', 'Burning', 'Steel'],
    second: ['Horizon', 'Protocol', 'Run', 'Frontier', 'Signal', 'Vector'],
    loglines: [
      'A retired pilot is pulled into one last mission when a rescue goes wrong over the open sea.',
      'Two rival agents must cooperate to stop a heist that spans three cities in one night.',
      'A courier with a perfect record discovers the package she carries could start a war.',
    ],
  },
  adventure: {
    first: ['Beyond', 'The Lost', 'Northern', 'Wild', 'Hidden', 'Golden'],
    second: ['Expedition', 'Map', 'Passage', 'Kingdom', 'Trail', 'Archipelago'],
    loglines: [
      'A cartographer and her estranged brother follow an old map into uncharted mountains.',
      'A teenage sailor joins a research voyage that drifts far from any known route.',
      'Explorers race a closing season to reach a valley no one has mapped in a century.',
    ],
  },
  animation: {
    first: ['Little', 'Paper', 'Moonlit', 'Cloud', 'Tiny', 'Clockwork'],
    second: ['Lanterns', 'Robots', 'Garden', 'Foxes', 'Kingdom', 'Orchestra'],
    loglines: [
      'A small robot who repairs streetlights sets out to fix the moon.',
      'Two paper birds escape a sketchbook and explore the house at night.',
      'A shy fox learns to conduct the forest orchestra before the winter festival.',
    ],
  },
  comedy: {
    first: ['Totally', 'The Wrong', 'Accidentally', 'Very', 'Weekend', 'Office'],
    second: ['Wedding', 'Neighbours', 'Famous', 'Roommates', 'Getaway', 'Party'],
    loglines: [
      'A wedding planner books two ceremonies on the same day at the same venue.',
      'Three strangers win a group holiday none of them actually entered.',
      'A food critic goes undercover as a waiter at the restaurant he panned.',
    ],
  },
  crime: {
    first: ['Cold', 'Night', 'Dirty', 'Quiet', 'Blind', 'Second'],
    second: ['Case', 'Ledger', 'Alibi', 'Precinct', 'Witness', 'Confession'],
    loglines: [
      'A junior detective reopens a closed case and finds the original file was rewritten.',
      'An accountant notices one transaction that ties a charity to a string of robberies.',
      'A night-shift taxi driver becomes the only witness to a crime nobody reported.',
    ],
  },
  documentary: {
    first: ['Inside', 'The Age of', 'Making', 'Voices of', 'Chasing', 'Planet'],
    second: ['Coral', 'Code', 'Rivers', 'Light', 'Bees', 'Cities'],
    loglines: [
      'Filmed over five years, the story of the people restoring a dying reef.',
      'How a handful of volunteers kept an open-source project alive for two decades.',
      'A journey along one river from glacier to delta, and the communities it sustains.',
    ],
  },
  drama: {
    first: ['The Long', 'Quiet', 'After the', 'Small', 'Paper', 'Distant'],
    second: ['Summer', 'Hours', 'Harvest', 'Letters', 'Shore', 'Promises'],
    loglines: [
      'Three siblings return to their childhood home to decide whether to sell it.',
      'A violin teacher and her most difficult student prepare for a final recital.',
      'A small-town doctor faces a choice between her clinic and her family.',
    ],
  },
  family: {
    first: ['Our', 'The Great', 'Grandpa’s', 'Backyard', 'Holiday', 'Treehouse'],
    second: ['Adventure', 'Road Trip', 'Secret', 'Club', 'Mystery', 'Summer'],
    loglines: [
      'A family road trip turns into a treasure hunt after a wrong turn.',
      'Kids build a treehouse that seems to open onto a different town each night.',
      'A grandfather teaches his grandchildren the magic tricks that made him famous.',
    ],
  },
  fantasy: {
    first: ['The Ember', 'Crown of', 'Shadow', 'The Glass', 'Song of', 'Realm of'],
    second: ['Throne', 'Dragons', 'Forest', 'Mage', 'Tides', 'Stars'],
    loglines: [
      'An apprentice mapmaker discovers her maps change the land they describe.',
      'The last dragon keeper must choose between her village and the egg she guards.',
      'A thief steals a crown that remembers every king who wore it.',
    ],
  },
  horror: {
    first: ['The Hollow', 'Do Not', 'Under the', 'Beneath', 'Whispering', 'The Ninth'],
    second: ['House', 'Answer', 'Floorboards', 'Lake', 'Woods', 'Room'],
    loglines: [
      'New owners of a lakeside cabin hear the radio play a station that no longer exists.',
      'A night guard at a museum notices one exhibit is never where she left it.',
      'Friends find a door in their rental that was not there when they arrived.',
    ],
  },
  romance: {
    first: ['Love in', 'Two', 'Letters to', 'A Summer in', 'Second', 'Starlight'],
    second: ['Lisbon', 'Tickets', 'June', 'Kyoto', 'Chances', 'Café'],
    loglines: [
      'Two translators fall for each other through the margins of the same novel.',
      'A baker and a florist compete for the same storefront and lose their hearts instead.',
      'Old pen pals finally meet when a cancelled flight strands them in the same city.',
    ],
  },
  'science-fiction': {
    first: ['Orbit', 'Echoes of', 'The Last', 'Quantum', 'Signal from', 'Colony'],
    second: ['Nine', 'Europa', 'Archive', 'Drift', 'Andromeda', 'Zero'],
    loglines: [
      'The crew of a deep-space station receives a message sent by themselves.',
      'An AI archivist must decide which human memories survive a data collapse.',
      'Colonists wake early from cryosleep to find their ship has changed course.',
    ],
  },
  thriller: {
    first: ['Dead', 'Zero', 'The Final', 'Blackout', 'Inside', 'Countdown'],
    second: ['Hour', 'Day', 'Call', 'City', 'Man', 'Line'],
    loglines: [
      'A crisis negotiator realizes the hostage-taker knows every move she will make.',
      'During a city-wide blackout, a nurse uncovers a plot inside her own hospital.',
      'A journalist has one hour to verify a leak before it is published worldwide.',
    ],
  },
};

const GENRE_LABEL: Record<MovieGenre, string> = {
  action: 'Action',
  adventure: 'Adventure',
  animation: 'Animation',
  comedy: 'Comedy',
  crime: 'Crime',
  documentary: 'Documentary',
  drama: 'Drama',
  family: 'Family',
  fantasy: 'Fantasy',
  horror: 'Horror',
  romance: 'Romance',
  'science-fiction': 'Science Fiction',
  thriller: 'Thriller',
};

export function mockMovie(genre: MovieGenre, index: number): ContentItem {
  const corpus = CORPUS[genre];
  const random = createRandom(`movie:${genre}:${index}`);
  const first = corpus.first[index % corpus.first.length] as string;
  const second = corpus.second[Math.floor(index / corpus.first.length) % corpus.second.length] as string;
  const title = `${first} ${second}`;
  const id = `movie:${genre}-${index}`;
  const year = between(random, 2019, 2026);
  return {
    id,
    type: 'movie',
    title,
    summary: pick(random, corpus.loglines),
    imageUrl: mockImage(id, 640, 360),
    url: `https://www.themoviedb.org/search?query=${encodeURIComponent(title)}`,
    source: 'TMDB',
    author: null,
    publishedAt: new Date(Date.UTC(year, between(random, 0, 11), between(random, 1, 28))).toISOString(),
    category: genre,
    tags: [GENRE_LABEL[genre], String(year)],
    reason: `genre:${genre}`,
    metrics: { label: 'rating', value: Math.round((5.8 + random() * 3.6) * 10) / 10 },
  };
}

export function mockMoviesPage(genres: MovieGenre[], page: number, pageSize: number) {
  const total = genres.length * MOCK_MOVIES_PER_GENRE;
  const start = (page - 1) * pageSize;
  const items: ContentItem[] = [];
  for (let k = start; k < Math.min(start + pageSize, total); k += 1) {
    const genre = genres[k % genres.length] as MovieGenre;
    items.push(mockMovie(genre, Math.floor(k / genres.length)));
  }
  return { items, hasMore: start + pageSize < total };
}

export function mockMovieCorpus(genres: readonly MovieGenre[], perGenre: number): ContentItem[] {
  return genres.flatMap((genre) => Array.from({ length: perGenre }, (_, index) => mockMovie(genre, index)));
}
