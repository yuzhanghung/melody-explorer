"use strict";

const url = "https://api.airtable.com/v0/appqpGQaagaMCb076/Table%201?maxRecords=3&view=Grid%20view";

// function for our list view
async function getAllRecords() {
  let getResultElement = document.getElementById("brews");

  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer patcfYwoAsbXE25FJ.59ca26a3811ad1ec9cc1804153bdfd5ff54e09828a8f27a6e62d93ebb83e8f60`,
    },
  };

  await fetch(
    url,
    options
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // response is an object w/ .records array
    });
  }

  getAllRecords();