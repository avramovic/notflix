# Notflix

Notflix is a Netflix-inspired streaming UI built with Vue 3 and Vite. The project is still a work in progress, with its current focus on fetching, organizing, and presenting movie and TV content in a polished, responsive single-page experience.

## Architecture

- **Frontend stack:** Vue 3, Vite, Vue Router, Pinia, Tailwind CSS, Swiper, and Vidstack.
- **Application structure:** the app is organized around page-level routes (`src/pages`), reusable UI components (`src/components`), shared composables/utilities, and Pinia stores for user, movie, and TV state.
- **Data layer:** content is loaded through `src/api/tmdb.js`, which normalizes external movie/TV data into a TMDB-like shape for consistent rendering across carousels, hover cards, and detail modals.
- **State and persistence:** profile selection, favorites/My List data, and ratings are managed in the user store and persisted in `localStorage`, while Firebase configuration exists as a foundation for future real authentication and backend features.
- **Build tooling:** Vite handles the SPA build, custom aliasing, and a small plugin that exposes avatar directories for the profile system.

## Current functionality

- Responsive landing, login, signup, profile-selection, and browse flows.
- Home, Movies, TV, Popular, Search, and My List/Favorites views powered by dynamic content fetching.
- Featured hero content, genre-based rows, top-10 sections, hover cards, and route-driven content detail modals.
- Guest-first profile management with editable avatars/profiles and persistent per-profile favorites.
- Search across movies and TV shows, plus supporting metadata such as cast, seasons, similar titles, and extended content details where available.

The codebase is intentionally modular so it can continue expanding into fuller authentication, profile management, and personalized recommendation features.

Uses https://imdbapi.dev/ proxied through https://imdb.6683549.xyz
Streaming https://vsembed.ru/ proxied through https://vidsrc.6683549.xyz