$(onReady);

function onReady() {
    //GET request
    getSongs();
    $('#add').on('click', postSong);
    //6. DELETE SONG click listener
    $('#songsTableBody').on('click', '.btn-delete', deleteSong);
    //10. PUT SONG click listener
    //make sure the name is correct
    //make sure we're calling the function
    $('#songsTableBody').on('click', '.btn-rank', voteOnSong);
}

// get artist data from the server
function getSongs() {
    $('#songsTableBody').empty();
    $.ajax({
        type: 'GET',
        url: '/songs',
    }).then(function (response) {
        console.log('GET /songs response', response);
        // append data to the DOM
        for (let i = 0; i < response.length; i++) {
            //4. create a DELETE and EDIT button
            //5. add data-id
            //9. create 2 buttons for rankup and rankdown
            $('#songsTableBody').append(`
                <tr>
                    <td>${response[i].artist}</td>
                    <td>${response[i].track}</td>
                    <td>${response[i].rank}</td>
                    <td>${response[i].published}</td>
                    <td>
                    <button
                        data-id=${response[i].id}
                        data-direction="up"
                        class="btn-rank">👍</button>
                    <button
                        data-id=${response[i].id}
                        data-direction="down"
                        class="btn-rank">💩</button>
                    <button
                        data-id=${response[i].id}
                        class="btn-delete"
                    >Delete</button>
                    </td>
                </tr>
            `);
        }
    });
}

// DELETE function
function deleteSong() {
    console.log("We're in DELETE");
    //0. grab the songId
    let songId = $(this).data('id');
    //1. AJAX DELETE request
    $.ajax({
        //2. change method to DELETE
        method: 'DELETE',
        url: `/songs/${songId}`,
    })
        //3. if successfully deleted, then...
        .then(function (response) {
            console.log('Boop! Deleted!', response);
            //4. UPDATE the information on DOM
            // GET request to get all the songs
            getSongs();
        })
        //4. if DELETE failed, then...
        .catch(function (error) {
            alert('Error in DELETE function on client.js:', error);
        });
}

function postSong() {
    let payloadObject = {
        artist: $('#artist').val(),
        track: $('#track').val(),
        rank: $('#rank').val(),
        published: $('#published').val(),
    };
    $.ajax({
        type: 'POST',
        url: '/songs',
        data: payloadObject,
    }).then(function (response) {
        $('#artist').val(''),
            $('#track').val(''),
            $('#rank').val(''),
            $('#published').val('');
        getSongs();
    });
}

//voteOnSong function
function voteOnSong() {
    // 6. declare songId
    let songId = $(this).data('id');
    // 7. declare voteDirection
    let voteDirection = $(this).data('direction');
    // 8. PUT AJAX
    $.ajax({
        method: 'PUT',
        url: `/songs/rank/${songId}`,
        // data = req.body
        data: { direction: voteDirection },
    })
        .then(function () {
            //retrieve songs
            getSongs();
        })
        .catch(function (error) {
            //alert user error
            alert('ERROR on VOTE:', error);
        });
}
