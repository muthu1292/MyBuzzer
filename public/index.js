const socket = io();
let isHost = false;
let teamNames = [];

function join() {
    const name = document.getElementById("teamName").value.trim();
    if (!name) {
        return alert("Enter team name");
    }
    socket.emit("register", name);
    document.getElementById("teamDisplay").innerText = name;
    if (name.toLowerCase() === "host") isHost = true;

    if (!isHost) {
        document.getElementById("joinDiv").style.display = "none";
        document.getElementById("buzzerDiv").style.display = "";
        document.getElementById("buzzBtn").style.display = "";
    } else {
        document.getElementById("joinDiv").style.display = "none";
        document.getElementById("buzzerDiv").style.display = "";
        document.getElementById("resetBtn").style.display = "";
        document.getElementById("teamScore").style.display = "";
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
    if(isHost){
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
        capsule.className = 'badge rounded-pill text-bg-info p-2 me-2';
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
const teamScores = {};

function initializeScores() {
    teamNames.forEach(name => teamScores[name] = 0);
}

// --- 1. Loop and Create Rows ---
function renderScoreboard() {
    const container = document.getElementById('scoreboard-container');
    container.innerHTML = ''; // Clear existing content

    teamNames.forEach(name => {
        const safeName = name.replace(/\s/g, '-').replace(/[^\w-]/g, ''); // Safe ID for HTML elements
        const currentScore = teamScores[name];

        // Create the HTML structure for a single team row using Bootstrap columns
        const teamRowHTML = `
                    <div class="row py-1 align-items-center team-row-item">
                        
                        <div class="col-4">
                            <h6 class="mb-0">${name}</h5>
                        </div>
                        
                        <div class="col-1 text-center">
                            <span id="score-${safeName}" class="score-display">${currentScore}</span>
                        </div>

                        <div class="col-7 d-flex align-items-center justify-content-end">

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
    console.log("Final Scores Submitted:");
    console.log(teamScores);

    let resultMessage = "Final Scores:\n\n";
    for (const team in teamScores) {
        resultMessage += `${team}: ${teamScores[team]}\n`;
    }

    alert(resultMessage);
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