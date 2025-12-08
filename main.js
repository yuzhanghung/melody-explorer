"use strict";

// Airtable Data
const AIRTABLE_URL = "https://api.airtable.com/v0/appqpGQaagaMCb076/Table%201?view=Grid%20view";

async function getAllRecords() {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer patcfYwoAsbXE25FJ.59ca26a3811ad1ec9cc1804153bdfd5ff54e09828a8f27a6e62d93ebb83e8f60`,
    },
  };

  const res = await fetch(AIRTABLE_URL, options);
  const data = await res.json();

  return data.records.map(record => {
    const f = record.fields;
    return {
      songName: f.SongName,
      mood: f.Mood,
      songInfo: f.SongInfo,
      artistBio: f.ArtistBio,
      spotifyURL: f.Spotify,
      releaseYear: f.ReleaseYear,
      picture: f.picture,
    };
  });
}



const PLAYLIST_ID = 14636156701;

// New proxy (different service)
const CORS_PROXY = "https://corsproxy.io/?";

async function getPlaylistTracks(playlistId) {
  const deezerUrl = `https://api.deezer.com/playlist/${playlistId}`;
  const proxiedUrl = CORS_PROXY + encodeURIComponent(deezerUrl);

  const res = await fetch(proxiedUrl);

  const data = await res.json();

  return data.tracks.data.map(track => ({
    id: track.id,
    title: track.title,
    artistName: track.artist?.name,
    albumCover: track.album?.cover_medium,
    previewUrl: track.preview,
  }));
}

function renderFeaturedTracks(tracks) {
  const container = document.getElementById("js-featured-track-container");
  container.innerHTML = "";

  const fourTracks = tracks.slice(0, 4);

  fourTracks.forEach(track => {
    const card = createTrackCard(track, true); // pass true = small card
    container.appendChild(card);
  });
}

function renderAllTracks(tracks) {
  const container = document.querySelector(".songs-container");
  container.innerHTML = "";

  tracks.forEach(track => {
    const card = createTrackCard(track, false); // false = full-size card
    container.appendChild(card);
  });
}


function createTrackCard(track, isFeatured) {
  const card = document.createElement("div");

  // Featured cards smaller:
  if (isFeatured) {
    card.className = "card track-card";
    card.style.width = "16rem";

    card.innerHTML = `
      <img src="${track.albumCover}" class="card-img-top album-cover" alt="${track.title}"/>
      <div class="card-body song-info">
        <h3 class="song-title">${track.title}</h3>
        <p class="artist-name">${track.artistName}</p>
      </div>

      <input 
        type="range" 
        class="progress-bar-audio"
        min="0"
        value="0"
        step="0.1"
      />

      <audio class="audio-preview" src="${track.previewUrl}"></audio>
      
      <div class="card-body song-actions d-flex gap-5 justify-content-center align-content-center">
        <button class="fav-btns"><span class="material-symbols-outlined">favorite</span></button>
        <button class="play-btn" data-preview="${track.previewUrl}"><span class="material-symbols-outlined icon">play_arrow</span></button>
        <a href="song-detail.html?id=${track.id}" class="detail-btn"><span class="material-symbols-outlined">read_more</span></a>
      </div>
    `;
  } else {
    // Full songs container cards (Bootstrap grid)
    card.className = "card col-12 col-md-4 col-lg-3 mb-3 small-card-track";
    card.innerHTML = `
      <div class="small-card d-flex justify-content-center align-items-center gap-4">
        <img src="${track.albumCover}" class="sml-album-cover" alt="${track.title}" />
        
        <div class="small-card-info">
          <h5 class="sm-card-title">${track.title}</h5>
          <p class="sm-artist-name">${track.artistName}</p>
        </div>
      </div>

      <div>
        <div class="card-body">
          <input 
            type="range" 
            class="progress-bar-audio"
            min="0"
            value="0"
            step="0.1"
          />
          <audio class="audio-preview" src="${track.previewUrl}"></audio>
        </div>

        <div class="card-body song-actions d-flex gap-5 justify-content-center align-content-center">
          <button class="fav-btn"><span class="material-symbols-outlined">favorite</span></button>
          <button class="play-btn" data-preview="${track.previewUrl}"><span class="material-symbols-outlined icon">play_arrow</span></button>
          <a href="song-detail.html?id=${track.id}" class="sm-detail-btn"><span class="material-symbols-outlined">read_more</span></a>
        </div>
      </div>
    `;

  }


  setupAudioControls(card, track); // calls play/pause + slider logic
  return card;
}


function setupAudioControls(card, track) {
  const playBtn = card.querySelector(".play-btn");
  const audio = card.querySelector(".audio-preview");
  const slider = card.querySelector(".progress-bar-audio");

  if (!track.previewUrl) {
    playBtn.disabled = true;
    playBtn.innerHTML = "No Preview";
    slider.disabled = true;
    return;
  }

  let isPlaying = false;


  audio.addEventListener("loadedmetadata", () => {
    slider.max = audio.duration || 30;
  });


  audio.addEventListener("timeupdate", () => {
    slider.value = audio.currentTime;
  });


  slider.addEventListener("input", () => {
    audio.currentTime = slider.value;
  });

  // Play / pause toggle
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play();
      playBtn.innerHTML = "<span class='material-symbols-outlined icon'>pause</span>";
      isPlaying = true;
    } else {
      audio.pause();
      playBtn.innerHTML = "<span class='material-symbols-outlined icon'>play_arrow</span>";
      isPlaying = false;
    }
  });

  // Reset when finished
  audio.addEventListener("ended", () => {
    isPlaying = false;
    slider.value = 0;
    playBtn.innerHTML = "<span class='material-symbols-outlined icon'>play_arrow</span>";
  });
}



function mergeTracks(deezerTracks, airtableRecords) {
  return airtableRecords.map(a => {
    const match = deezerTracks.find(t => t.title === a.songName);

    return {
      // id for the song-detail link
      id: match?.id || null,

      // Display fields
      title: a.songName,                
      artistName: match?.artistName || "",
      albumCover: match?.albumCover || "img/about.png",
      previewUrl: match?.previewUrl || null,

      // Airtable mood & extra info
      mood: a.mood,                      
      songInfo: a.songInfo,
      artistBio: a.artistBio,
      spotifyURL: a.spotifyURL,
      releaseYear: a.releaseYear,
      picture: a.picture,
    };
  });
}

let allTracks = []; // will hold merged tracks with mood


function setupMoodFilters() {
  const buttons = document.querySelectorAll(".filter-btns button");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mood = btn.dataset.mood; 

      // visual active state
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // filter tracks by mood
      const filtered = allTracks.filter(track => track.mood === mood);

      renderAllTracks(filtered);
    });
  });
}


async function main() {
  try {
    const [deezerTracks, airtableRecords] = await Promise.all([
      getPlaylistTracks(PLAYLIST_ID),
      getAllRecords(),
    ]);

    const merged = mergeTracks(deezerTracks, airtableRecords);
    console.log("Merged tracks:", merged);

    allTracks = merged; // save for filtering

    renderFeaturedTracks(merged); 
    renderAllTracks(merged);      // all songs initially

    setupMoodFilters();           // wire up buttons

  } catch (err) {
    console.error(err);
  }
}

main();

