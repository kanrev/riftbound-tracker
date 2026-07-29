        let currentTurn = 1;
        let playersEndedTurn = { 1: false, 2: false };
        let p1Score = 0;
        let p2Score = 0;
        let historyData = {};
        let savedGames = loadGames();
        let viewingGameId = null;
        let turnEventCounter = 0;

        const undoStack = { 1: [], 2: [] };
        const playerNames = { 1: 'Player 1', 2: 'Player 2' };

        function getName(p) { return playerNames[p]; }

        function saveName(player) {
            const input = document.getElementById(`renameInput${player}`);
            const val = input.value.trim();
            if (!val) return;
            playerNames[player] = val;
            document.getElementById(`p${player}Name`).innerText = val;
            input.value = '';
            const btn = input.nextElementSibling;
            btn.innerText = '✓';
            setTimeout(() => btn.innerText = 'Save', 1200);
        }

        function openRenameFromPane(player) {
            openSettings();
            const input = document.getElementById(`renameInput${player}`);
            input.value = getName(player);
            setTimeout(() => input.focus(), 100);
        }

        function refreshEndTurnButtons() {
            const btn1 = document.getElementById('endTurnBtn1');
            const btn2 = document.getElementById('endTurnBtn2');

            btn1.disabled = playersEndedTurn[1];
            btn2.disabled = playersEndedTurn[2] || (currentTurn > 1 && !playersEndedTurn[1]);
        }

        function nextTurn(player) {
            if (playersEndedTurn[player]) return;

            playersEndedTurn[player] = true;
            let incremented = false;

            if (playersEndedTurn[1] && playersEndedTurn[2]) {
                if (!historyData[currentTurn]) {
                    historyData[currentTurn] = { 1: [], 2: [] };
                }

                currentTurn++;
                playersEndedTurn[1] = false;
                playersEndedTurn[2] = false;
                incremented = true;

                updateTurnLabel();
                animateTurnDisplays();
            }

            const id = ++turnEventCounter;
            const action = { type: 'turn', id, player, incremented };

            undoStack[1].push(action);
            undoStack[2].push(action);

            refreshUndoButtons();
            refreshEndTurnButtons();
        }

        function updateTurnLabel() {
            const label = `TURN ${currentTurn}`;
            document.getElementById('turnDisplay1').innerText = label;
            document.getElementById('turnDisplay2').innerText = label;
        }

        function animateTurnDisplays() {
            ['turnDisplay1', 'turnDisplay2'].forEach(id => {
                const el = document.getElementById(id);
                el.classList.remove('pop');
                void el.offsetWidth;
                el.classList.add('pop');
            });
        }

        function scorePoint(player, type) {
            const score = player === 1 ? p1Score : p2Score;
            if (score >= 8) return;
            if (player === 1) {
                p1Score++;
                document.getElementById('p1Score').innerText = p1Score;
            } else {
                p2Score++;
                document.getElementById('p2Score').innerText = p2Score;
            }

            const currentTotal = (player === 1) ? p1Score : p2Score;

            if (!historyData[currentTurn]) historyData[currentTurn] = { 1: [], 2: [] };
            historyData[currentTurn][player].push(`${currentTotal}${type}`);

            undoStack[player].push({ type: 'score', turn: currentTurn });
            refreshUndoButtons();

            const scoreEl = document.getElementById(`p${player}Score`);
            scoreEl.classList.remove('pop');
            void scoreEl.offsetWidth;
            scoreEl.classList.add('pop');

            const pane = document.getElementById(`pane${player}`);
            pane.classList.remove('flash-conquer', 'flash-hold');
            void pane.offsetWidth;
            pane.classList.add(type === 'C' ? 'flash-conquer' : 'flash-hold');
            
            refreshActionButtons();
        }

        function undoAction(player) {
            if (undoStack[player].length === 0) return;

            const action = undoStack[player].pop();

            if (action.type === 'turn') {
                if (action.incremented) {
                    currentTurn--;
                    const otherPlayer = action.player === 1 ? 2 : 1;
                    playersEndedTurn[otherPlayer] = true;
                    playersEndedTurn[action.player] = false;

                    if (historyData[currentTurn] && 
                        historyData[currentTurn][1].length === 0 && 
                        historyData[currentTurn][2].length === 0) {
                        delete historyData[currentTurn];
                    }
                } else {
                    playersEndedTurn[action.player] = false;
                }

                updateTurnLabel();
                refreshEndTurnButtons();

                const other = player === 1 ? 2 : 1;
                const idx = undoStack[other].findLastIndex(a => a.type === 'turn' && a.id === action.id);
                if (idx !== -1) undoStack[other].splice(idx, 1);
            } else {
                const turn = action.turn;
                historyData[turn][player].pop();

                if (turn === currentTurn && 
                    historyData[turn][1].length === 0 && 
                    historyData[turn][2].length === 0) {
                    delete historyData[turn];
                }

                if (player === 1) {
                    p1Score--;
                    document.getElementById('p1Score').innerText = p1Score;
                } else {
                    p2Score--;
                    document.getElementById('p2Score').innerText = p2Score;
                }

                let idx = 1;
                Object.keys(historyData).sort((a, b) => a - b).forEach(t => {
                    historyData[t][player] = historyData[t][player].map(e => `${idx++}${e.slice(-1)}`);
                });
            }

            refreshUndoButtons();
            refreshActionButtons();
        }

        function refreshUndoButtons() {
            document.getElementById('undoBtn1').disabled = undoStack[1].length === 0;
            document.getElementById('undoBtn2').disabled = undoStack[2].length === 0;
        }

        function refreshActionButtons() {
            const p1Capped = p1Score >= 8;
            const p2Capped = p2Score >= 8;

            document.querySelectorAll('#pane1 .action-btn').forEach(btn => btn.disabled = p1Capped);
            document.querySelectorAll('#pane2 .action-btn').forEach(btn => btn.disabled = p2Capped);
        }

        function newGame() {
            if (p1Score === 0 && p2Score === 0) {
                if (!confirm("Start a new game?")) return;
            } else {
                if (!confirm("Save this game and start a new one?")) return;
                saveCurrentGame();
            }
            resetState();
        }

        function loadGames() {
            try { return JSON.parse(localStorage.getItem('riftbound_savedGames') || '[]'); }
            catch { return []; }
        }

        function persistGames() {
            localStorage.setItem('riftbound_savedGames', JSON.stringify(savedGames));
        }

        function saveCurrentGame() {
            savedGames.push({
                id: Date.now(),
                title: `${getName(1)} vs ${getName(2)} — ${formatDateTime(new Date())}`,
                p1Name: getName(1),
                p2Name: getName(2),
                p1Final: p1Score,
                p2Final: p2Score,
                historyData: JSON.parse(JSON.stringify(historyData))
            });
            persistGames();
        }

        function formatDateTime(date) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }

        function resetState() {
            currentTurn = 1;
            playersEndedTurn = { 1: false, 2: false };
            p1Score = 0;
            p2Score = 0;
            historyData = {};
            undoStack[1] = [];
            undoStack[2] = [];
            turnEventCounter = 0;
            document.getElementById('p1Score').innerText = "0";
            document.getElementById('p2Score').innerText = "0";
            updateTurnLabel();
            refreshUndoButtons();
            refreshActionButtons();
            refreshEndTurnButtons();
        }

        function openSettings() {
            document.getElementById('renameInput1').placeholder = getName(1);
            document.getElementById('renameInput2').placeholder = getName(2);
            document.getElementById('settingsModal').style.display = 'flex';
        }

        function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

        function clearHistory() {
            if (savedGames.length === 0) { alert("No saved games to clear."); return; }
            if (confirm("Permanently delete all saved game history? This cannot be undone.")) {
                savedGames = [];
                persistGames();
                closeSettings();
            }
        }

        function openLog() {
            renderCurrentGameLog();
            document.getElementById('logModal').style.display = 'flex';
        }

        function closeLog() {
            document.getElementById('logModal').style.display = 'none';
        }

        function renderCurrentGameLog() {
            document.getElementById('logP1Header').innerText = getName(1).toUpperCase();
            document.getElementById('logP2Header').innerText = getName(2).toUpperCase();

            const rows = document.getElementById('logRows');
            rows.innerHTML = '';

            if (Object.keys(historyData).length === 0) {
                rows.innerHTML = '<div class="empty-state">No moves recorded yet.</div>';
                return;
            }

            const fmt = entries => entries.length
                ? entries.map(e => `<span class="${e.endsWith('C') ? 'c-entry' : 'h-entry'}">${e}</span>`).join(' ')
                : '—';

            Object.keys(historyData).sort((a, b) => a - b).forEach(turn => {
                const row = document.createElement('div');
                row.className = 'table-row';
                row.innerHTML = `
                    <div class="col-turn">${turn}</div>
                    <div class="col-player">${fmt(historyData[turn][1])}</div>
                    <div class="col-player">${fmt(historyData[turn][2])}</div>
                `;
                rows.appendChild(row);
            });
        }

        function openHistory() {
            renderGameList();
            document.getElementById('settingsModal').style.display = 'none';
            document.getElementById('historyModal').style.display = 'flex';
        }

        function renderGameList() {
            const list = document.getElementById('gameList');
            list.innerHTML = '';

            if (savedGames.length === 0) {
                list.innerHTML = '<div class="empty-state">No saved games yet.</div>';
                return;
            }

            [...savedGames].reverse().forEach(game => {
                const card = document.createElement('div');
                card.className = 'game-card';
                card.innerHTML = `
                    <div class="game-card-info">
                        <div class="game-card-title">${game.title}</div>
                        <div class="game-card-meta">${Object.keys(game.historyData).length} turn(s)</div>
                    </div>
                    <div class="game-card-scores">
                        <div class="score-chip"><span>${game.p1Name}</span><span>${game.p1Final}</span></div>
                        <div class="score-divider">–</div>
                        <div class="score-chip"><span>${game.p2Name}</span><span>${game.p2Final}</span></div>
                    </div>
                    <div class="chevron">›</div>
                `;
                card.onclick = () => openDetail(game);
                list.appendChild(card);
            });
        }

        function closeHistory() {
            document.getElementById('historyModal').style.display = 'none';
            document.getElementById('detailModal').style.display  = 'none';
            viewingGameId = null;
        }

        function openDetail(game) {
            viewingGameId = game.id;
            document.getElementById('detailTitle').innerText    = game.title;
            document.getElementById('detailP1Header').innerText = game.p1Name.toUpperCase();
            document.getElementById('detailP2Header').innerText = game.p2Name.toUpperCase();

            const deleteBtn = document.getElementById('deleteGameBtn');
            deleteBtn.onclick = () => deleteGame(game.id);

            const rows = document.getElementById('detailRows');
            rows.innerHTML = '';

            Object.keys(game.historyData).sort((a, b) => a - b).forEach(turn => {
                const fmt = entries => entries.length
                    ? entries.map(e => `<span class="${e.endsWith('C') ? 'c-entry' : 'h-entry'}">${e}</span>`).join(' ')
                    : '—';

                const row = document.createElement('div');
                row.className = 'table-row';
                row.innerHTML = `
                    <div class="col-turn">${turn}</div>
                    <div class="col-player">${fmt(game.historyData[turn][1])}</div>
                    <div class="col-player">${fmt(game.historyData[turn][2])}</div>
                `;
                rows.appendChild(row);
            });

            document.getElementById('historyModal').style.display = 'none';
            document.getElementById('detailModal').style.display  = 'flex';
        }

        function deleteGame(id) {
            if (!confirm("Delete this game from history? This cannot be undone.")) return;
            savedGames = savedGames.filter(g => g.id !== id);
            persistGames();
            document.getElementById('detailModal').style.display = 'none';
            viewingGameId = null;
            renderGameList();
            document.getElementById('historyModal').style.display = 'flex';
        }

        function backToList() {
            document.getElementById('detailModal').style.display  = 'none';
            document.getElementById('historyModal').style.display = 'flex';
        }

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/riftbound-tracker/sw.js', {
                    scope: '/riftbound-tracker/'
                }).catch(() => {});
            });
        }