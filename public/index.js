const socket = io();
let isHost = false;
let teamNames = [];
const teamScores = {};

function join() {
    const name = document.getElementById("teamName").value.trim();
    if (!name) {
        return alert("Enter team name");
    }
    socket.emit("register", name);
    document.getElementById("teamDisplay").innerText = name;
    if (name.toLowerCase() === "host") isHost = true;

     document.getElementById("buzzerDiv").style.display = "";

    if (!isHost) {
        document.getElementById("joinDiv").style.display = "none";        
        document.getElementById("buzzBtn").style.display = "";
    } else {
        //HOST Logic
        document.getElementById("joinDiv").style.display = "none";       
        document.getElementById("resetBtn").style.display = "";
        document.getElementById("teamScore").style.display = "";        
        document.getElementById("hostDiv").style.display = "";
    }

}

function buzz() {
    document.getElementById("buzzBtn").classList.add("disabled");
    socket.emit("buzz");
    playAudio();
}
function reset() {
    if (!isHost) return alert("Only host can reset!");
    socket.emit("reset");
}

function scoreReset(){
    if (confirm("Are you sure you want to reset ALL team scores to zero?")) {
        socket.emit("resetScore");
        teamScores = {};
        resetScores();
    }
}

socket.on("winner", (name, ts) => {

    const winnercontainer = document.getElementById('winner');
    const winnerName = document.createElement('span');
    winnerName.textContent = "🏆 " + name + " buzzed first!";
    winnerName.className = 'badge rounded-pill text-bg-success p-2 me-2';
    winnercontainer.appendChild(winnerName);

    //document.getElementById("winner").innerText = "🏆 " + name + " buzzed first!";
});
socket.on("reset", () => {
    document.getElementById("buzzBtn").classList.remove("disabled");
    document.getElementById("winner").innerText = "";
    document.getElementById('runner').innerText = "";
});

socket.on("runner", (name, ts) => {
    const runnercontainer = document.getElementById('runner');
    const runnerName = document.createElement('span');
    runnerName.textContent = name + " +" + ts;
    runnerName.className = 'badge rounded-pill text-bg-secondary p-2 me-2';
    runnercontainer.appendChild(runnerName);
});

socket.on("teamList", list => {
    renderTags(list);
    if (isHost) {
        teamNames = [];
        teamNames = list;
        resetScores();
    }
});

socket.on("reload", () => {
    //join(false);
    var currName = document.getElementById("teamDisplay").innerText.trim();
    if (currName) {
        socket.emit("register", currName);
    }
});

socket.on("teamScore", (scoreResults) => {
    //console.log(scoreResults);
    renderScoreTable(scoreResults);
});

function renderTags(list) {
    const container = document.getElementById('allTeams');
    container.innerHTML = '';
    if (!container) {
        console.error("Tag container element not found.");
        return;
    }

    // --- 2. Iterate and create elements ---
    list.forEach(text => {
        // Create the capsule element
        const capsule = document.createElement('span');
        // --- 3. Apply Tailwind Capsule Styling (Simulating bg-info) ---
        // Using blue colors for the 'info' style, rounded-full for capsule shape
        capsule.className = 'badge rounded-pill border border-primary text-primary px-2 py-1 me-2 mb-1';
        // Set the text content
        capsule.textContent = text;
        // Append the new capsule to the container
        container.appendChild(capsule);
    });
}

function playAudio() {
    var audio = new Audio('buzzer.wav');
    audio.play();
}

// Initialize scores (using an object for simple key-value storage)


function initializeScores() {
    teamNames.forEach(name => teamScores[name] = 0);
}

// --- 1. Loop and Create Rows ---
function renderScoreboard() {
    const container = document.getElementById('scoreboard-container');
    container.innerHTML = ''; // Clear existing content

    teamNames.forEach(name => {
        if (!name || name.toLowerCase() === "host") {
            //Host
        } else {
            const safeName = name.replace(/\s/g, '-').replace(/[^\w-]/g, ''); // Safe ID for HTML elements
            const currentScore = teamScores[name];

            // Create the HTML structure for a single team row using Bootstrap columns
            const teamRowHTML = `
                    <div class="row py-1 align-items-center team-row-item">
                        
                        <div class="col-3">
                            <h6 class="mb-0">${name}</h5>
                        </div>
                        
                        <div class="col-1 text-center">
                            <span id="score-${safeName}" class="score-display">${currentScore}</span>
                        </div>

                        <div class="col-8 d-flex align-items-center justify-content-end">

                            <div class="btn-group me-1" role="group">
                                <button type="button" class="btn btn-outline-success" onclick="updateScore('${name}', 10)">+10</button>
                                <button type="button" class="btn btn-outline-success" onclick="updateScore('${name}', 5)">+5</button>
                                <button type="button" class="btn btn-outline-danger" onclick="updateScore('${name}', -5)">-5</button>
                            </div>

                            <div class="input-group" style="width: 150px;">
                                <input type="number" id="input-${safeName}" class="form-control form-control-sm" placeholder="" aria-label="Custom Score">
                                <button class="btn btn-primary btn-sm" type="button" onclick="applyCustomScore('${name}')">+</button>
                            </div>
                        </div>
                    </div>
                `;
            container.innerHTML += teamRowHTML;
        }
    });
}

// --- Scoring Logic ---

function updateScore(teamName, change) {
    let score = teamScores[teamName];
    score += change;
    teamScores[teamName] = score;

    // Update the display for this specific team
    const safeName = teamName.replace(/\s/g, '-').replace(/[^\w-]/g, '');
    document.getElementById(`score-${safeName}`).textContent = score;
}

function applyCustomScore(teamName) {
    const safeName = teamName.replace(/\s/g, '-').replace(/[^\w-]/g, '');
    const inputElement = document.getElementById(`input-${safeName}`);
    const customValue = parseInt(inputElement.value);

    if (!isNaN(customValue) && customValue !== 0) {
        // Use the existing updateScore function to add the custom value
        updateScore(teamName, customValue);
        inputElement.value = ''; // Clear the input box
    } else if (customValue === 0) {
        alert(`Cannot add 0. Please use a positive or negative number for ${teamName}.`);
    }
}

// --- 2. Submit Button Action ---

function submitScore() {
    //console.log("Final Scores Submitted:");
    //console.log(teamScores);

    //let resultMessage = "Final Scores:\n\n";
    //for (const team in teamScores) {
    //    resultMessage += `${team}: ${teamScores[team]}\n`;
    //}

    socket.emit("addScore", teamScores);

    //alert(resultMessage);
    resetScores();
    // In a real application, you would use fetch() or AJAX here 
    // to send teamScores to a server-side script.
}

function resetScores() {
    //if (confirm("Are you sure you want to reset ALL team scores to zero?")) {
    initializeScores(); // Reset the data
    renderScoreboard(); // Re-render the UI with new zero values
    //alert("Scores have been reset!");
    //}
}

function renderScoreTable(data) {
    // Get the list of all teams (keys of the inner objects)
    const teams = Object.keys(data[1] || {});
    // Get the list of all rounds (keys of the outer object)
    const rounds = Object.keys(data);

    // Calculate initial totals for each team
    const totals = teams.reduce((acc, team) => {
        acc[team] = 0;
        return acc;
    }, {});

    // --- 2. Build the table structure with Bootstrap 5 classes ---

    let html = `
            <table class="table table-striped table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th scope="col">Round</th>
                        ${teams.map(team => `<th scope="col" class="text-center">${team}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

    // Add rows for each round
    rounds.forEach(round => {
        html += `<tr><th scope="row">${round}</th>`;
        teams.forEach(team => {
            const score = data[round][team] || 0;
            // Update the running total
            totals[team] += score;
            // Add a class for negative scores if needed (optional styling)
            let scoreClass = score < 0 ? 'text-danger fw-bold' : 'text-success fw-bold';
            scoreClass = score === 0 ? "" : scoreClass;
            html += `<td class="text-center ${scoreClass}">${score}</td>`;
        });
        html += `</tr>`;
    });

    // Add the total score row in <tfoot>
    html += `
                </tbody>
                <tfoot class="table-primary fw-bold">
                    <tr>
                        <td class="text-end">Total Score</td>
                        ${teams.map(team => `<td class="text-center">${totals[team]}</td>`).join('')}
                    </tr>
                </tfoot>
            </table>
        `;

    // 3. Insert the generated HTML into the container
    document.getElementById('scoreTableContainer').innerHTML = html;
}