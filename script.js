"use strict";

// Airtable Data

const url = "https://api.airtable.com/v0/appqpGQaagaMCb076/Table%201?view=Grid%20view";

// function for our list view
async function getAllRecords() {
  //let getResultElement = document.getElementsByClassName("featured-track-container");

  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer patcfYwoAsbXE25FJ.59ca26a3811ad1ec9cc1804153bdfd5ff54e09828a8f27a6e62d93ebb83e8f60`,
    },
  };

  const res = await fetch(
    url,
    options
  );

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

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}


// Deezer Data

const PLAYLIST_ID = 14636156701;

// New proxy (different service)
const CORS_PROXY = "https://corsproxy.io/?";

async function getPlaylistTracks(playlistId) {
  const deezerUrl = `https://api.deezer.com/playlist/${playlistId}`;
  const proxiedUrl = CORS_PROXY + encodeURIComponent(deezerUrl);

  const res = await fetch(proxiedUrl);

  const data = await res.json();

  console.log("Raw Deezer track[0]:", data.tracks.data[0]); // 👈 look in console


  return data.tracks.data.map(track => ({
    id: track.id,
    title: track.title,
    artistName: track.artist?.name,
    albumCover: track.album?.cover_medium,
    previewUrl: track.preview,
  }));
}


function mergeTracks(deezerTracks, airtableRecords) {
  return airtableRecords.map(a => {
    const match = deezerTracks.find(t => t.title === a.songName);

    return {
      // Airtable data:
      songName: a.songName,
      mood: a.mood,
      songInfo: a.songInfo,
      artistBio: a.artistBio,
      spotifyURL: a.spotifyURL,
      releaseYear: a.releaseYear,
      picture: a.picture?.[0]?.url || null,

      // Deezer data (may be undefined if not found):
      deezerId: match?.id || null, 
      previewUrl: match?.previewUrl || null,
      artistName: match?.artistName || null,
      albumCover: match?.albumCover || "img/about.png",
    };
  });
}



const songCardEl = document.getElementById("js-song-card");
const artistCardEl = document.getElementById("js-artist-card");

function renderSongDetail(song) {
  songCardEl.innerHTML = `
    <div class="row g-0">
      <div class="col-md-4 text-center">
        <img src="${song.albumCover}" class="img-fluid rounded-start" alt="${song.songName}">
        ${
          song.previewUrl
            ? `
              <audio controls class="audio mt-2">
                <source src="${song.previewUrl}" type="audio/mpeg">
                Your browser does not support the audio element.
              </audio>
            `
            : `<p class="mt-2">No preview available</p>`
        }
      </div>
      <div class="col-md-8">
        <div class="card-body song-detail-container">
          <h5 class="card-title">${song.songName}</h5>
          <p class="artist-name">${song.artistName}</p>
          <div class="badges-container">
            <span class="badge">${song.releaseYear}</span>
            <span class="badge">${song.mood}</span>
          </div>
          <p class="card-text">${song.songInfo}</p>
        </div>
      </div>
    </div>
  `;

  artistCardEl.innerHTML = `
    <div class="row g-0">
      <div class="col-md-4 text-center">
        <img src="${song.picture}" class="artist-pic" alt="${song.artistName}">
      </div>
      <div class="col-md-8">
        <div class="card-body song-detail-container">
          <h5 class="artist-names">${song.artistName}</h5>
          <p class="card-text artist-bio">${song.artistBio}</p>

          ${
            song.spotifyURL
              ? `<a href="${song.spotifyURL}" target="_blank" class="artist-link">More Songs on Spotify →</a>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}


async function main() {
  try {
    const [deezerTracks, airtableRecords] = await Promise.all([
      getPlaylistTracks(PLAYLIST_ID),
      getAllRecords(),
    ]);

    const merged = mergeTracks(deezerTracks, airtableRecords);

    const idFromUrl = getQueryParam("id");
    console.log("Track id from URL:", idFromUrl);

    if (!idFromUrl) {
      console.error("No id query parameter found.");
      return;
    }

    // Deezer ids are numbers, URL params are strings → normalize
    const song = merged.find(s => String(s.deezerId) === String(idFromUrl));

    if (!song) {
      console.error("No song found for id:", idFromUrl);
      return;
    }

    renderSongDetail(song);

  } catch (err) {
    console.error(err);
  }
}

main();





 