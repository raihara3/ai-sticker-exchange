// Sticker Assets
const ASSETS = [
    'assets/cat.png',
    'assets/gem.png',
    'assets/star.png',
    'assets/heart.png'
];

// State
let state = {
    inventory: []
};

// DOM Elements
const sections = {
    generate: document.getElementById('section-generate'),
    book: document.getElementById('section-book'),
    exchange: document.getElementById('section-exchange')
};

const navItems = document.querySelectorAll('.nav-item');
const btnGenerate = document.getElementById('btn-generate');
const generationResult = document.getElementById('generation-result');
const newStickerImg = document.getElementById('new-sticker-img');
const btnSaveSticker = document.getElementById('btn-save-sticker');
const stickerGrid = document.getElementById('sticker-grid');

// Exchange Elements
// Exchange Elements
const btnModeGive = document.getElementById('btn-mode-give');
const btnModeGet = document.getElementById('btn-mode-get');
const exchangeGive = document.getElementById('exchange-give');
const exchangeGet = document.getElementById('exchange-get');
const giveStickerGrid = document.getElementById('give-sticker-grid');
const qrDisplayArea = document.getElementById('qr-display-area');
const qrcodeContainer = document.getElementById('qrcode');
const btnCloseQr = document.getElementById('btn-close-qr');
const btnStopScan = document.getElementById('btn-stop-scan');
const scanStatus = document.getElementById('scan-status');

let html5QrCode = null;
const stickerPrompt = document.getElementById('sticker-prompt');

let selectedStickerIndex = null;

// Initialization
function init() {
    loadState();
    setupNavigation();
    setupGeneration();
    setupExchange();
    renderStickerBook();
}

function loadState() {
    const saved = localStorage.getItem('sticker_app_state');
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem('sticker_app_state', JSON.stringify(state));
    renderStickerBook();
}

// Navigation
function setupNavigation() {
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            navItems.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch Section
            const targetId = btn.dataset.target;
            
            // Stop scanning if leaving exchange
            if (targetId !== 'section-exchange') {
                stopScanning();
            }

            Object.values(sections).forEach(sec => sec.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active-section');
        });
    });
}

// Generation Logic
function setupGeneration() {
    btnGenerate.addEventListener('click', async () => {
        const promptText = stickerPrompt.value.trim();

        if (!promptText) {
            alert('どんなシールを作るか教えてね！');
            stickerPrompt.focus();
            return;
        }

        // UI Update
        btnGenerate.disabled = true;
        btnGenerate.innerHTML = '<span class="btn-icon">⏳</span> GENERATING...';
        stickerPrompt.disabled = true;
        
        try {
            // Use Pollinations.ai (Free, No Key)
            // System prompt: Heisei style, sticker, white background
            // Using 'flux' model for better quality
            // Translate keywords to English for better model understanding
            const systemPrompt = "sticker style, vector illustration, white background, flat color, pop, no shadow";
            const fullPrompt = `${systemPrompt}, ${promptText}`;
            const encodedPrompt = encodeURIComponent(fullPrompt);
            const seed = Math.floor(Math.random() * 10000);
            const url = `https://pollinations.ai/p/${encodedPrompt}?width=600&height=600&seed=${seed}&model=flux`;

            // Load image directly (Bypass CORS fetch restriction)
            const tempImg = new Image();
            tempImg.onload = () => {
                // Show result
                newStickerImg.src = url;
                generationResult.classList.remove('hidden');
                btnGenerate.classList.add('hidden');
                
                // Setup save button
                btnSaveSticker.onclick = () => {
                    state.inventory.push({
                        id: Date.now(),
                        src: url, // Save the URL instead of Base64
                        date: new Date().toISOString(),
                        prompt: promptText
                    });
                    saveState();
                    resetGeneration();
                };
            };
            
            tempImg.onerror = () => {
                console.error('Image load failed');
                alert('画像の生成に失敗しました。もう一度試してみてください。');
                btnGenerate.disabled = false;
                btnGenerate.innerHTML = '<span class="btn-icon">✨</span> MAKE STICKER <span class="btn-icon">✨</span>';
                stickerPrompt.disabled = false;
            };

            tempImg.src = url;

        } catch (error) {
            console.error('Generation setup failed:', error);
            alert('エラーが発生しました: ' + error.message);
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = '<span class="btn-icon">✨</span> MAKE STICKER <span class="btn-icon">✨</span>';
            stickerPrompt.disabled = false;
        }
    });
}

function resetGeneration() {
    generationResult.classList.add('hidden');
    btnGenerate.classList.remove('hidden');
    btnGenerate.disabled = false;
    btnGenerate.innerHTML = '<span class="btn-icon">✨</span> MAKE STICKER <span class="btn-icon">✨</span>';
    stickerPrompt.value = ''; // Clear prompt
    
    // Switch to book view to show the new sticker
    document.querySelector('[data-target="section-book"]').click();
}

// Sticker Book Logic
function renderStickerBook() {
    stickerGrid.innerHTML = '';
    
    if (state.inventory.length === 0) {
        stickerGrid.innerHTML = '<div class="empty-state">No stickers yet! Go generate some!</div>';
        return;
    }

    state.inventory.forEach(sticker => {
        const el = document.createElement('div');
        el.className = 'sticker-item';
        el.innerHTML = `<img src="${sticker.src}" alt="Sticker">`;
        stickerGrid.appendChild(el);
    });
}

// Exchange Logic
// Exchange Logic
function setupExchange() {
    btnModeGive.addEventListener('click', showGiveMode);
    btnModeGet.addEventListener('click', showGetMode);
    btnCloseQr.addEventListener('click', () => {
        qrDisplayArea.classList.add('hidden');
        giveStickerGrid.classList.remove('hidden');
    });
    btnStopScan.addEventListener('click', stopScanning);
}

function showGiveMode() {
    exchangeGive.classList.remove('hidden');
    exchangeGet.classList.add('hidden');
    qrDisplayArea.classList.add('hidden');
    giveStickerGrid.classList.remove('hidden');
    
    renderGiveGrid();
}

function renderGiveGrid() {
    giveStickerGrid.innerHTML = '';
    if (state.inventory.length === 0) {
        giveStickerGrid.innerHTML = '<p style="text-align:center; width:100%;">No stickers to give!</p>';
        return;
    }

    state.inventory.forEach(sticker => {
        const el = document.createElement('div');
        el.className = 'sticker-item';
        el.innerHTML = `<img src="${sticker.src}" alt="Sticker">`;
        el.onclick = () => generateQR(sticker);
        giveStickerGrid.appendChild(el);
    });
}

function generateQR(sticker) {
    giveStickerGrid.classList.add('hidden');
    qrDisplayArea.classList.remove('hidden');
    qrcodeContainer.innerHTML = '';

    // Create JSON data for the sticker
    const data = JSON.stringify({
        id: sticker.id,
        src: sticker.src,
        prompt: sticker.prompt || 'Unknown'
    });

    new QRCode(qrcodeContainer, {
        text: data,
        width: 200,
        height: 200
    });
}

function showGetMode() {
    exchangeGive.classList.add('hidden');
    exchangeGet.classList.remove('hidden');
    startScanning();
}

function startScanning() {
    if (html5QrCode) {
        // Already running
        return;
    }

    scanStatus.innerText = "Requesting camera access...";
    
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
    .catch(err => {
        console.error(err);
        scanStatus.innerText = "Camera error: " + err;
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            scanStatus.innerText += " (HTTPS required)";
        }
    });
}

function onScanSuccess(decodedText, decodedResult) {
    try {
        const data = JSON.parse(decodedText);
        if (data.src) {
            // Check for duplicate
            const exists = state.inventory.some(s => s.id === data.id || s.src === data.src);
            
            if (exists) {
                alert('You already have this sticker!');
            } else {
                state.inventory.push({
                    id: Date.now(), // New ID for the receiver
                    src: data.src,
                    date: new Date().toISOString(),
                    prompt: data.prompt
                });
                saveState();
                alert('Sticker Received! ✨');
                renderStickerBook();
            }
            
            stopScanning();
            // Go to book
            document.querySelector('[data-target="section-book"]').click();
        }
    } catch (e) {
        console.error('Invalid QR', e);
    }
}

function onScanFailure(error) {
    // console.warn(`Code scan error = ${error}`);
}

function stopScanning() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
            scanStatus.innerText = "Stopped";
        }).catch(err => {
            console.error("Failed to stop", err);
        });
    }
}

// Start
init();
