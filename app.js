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
const giveSlot = document.getElementById('give-slot');
const givePlaceholder = document.getElementById('give-placeholder');
const giveImg = document.getElementById('give-img');
const receiveSlot = document.getElementById('receive-slot');
const receiveImg = document.getElementById('receive-img');
const btnExchange = document.getElementById('btn-exchange');
const modal = document.getElementById('selection-modal');
const modalGrid = document.getElementById('modal-sticker-grid');
const btnCloseModal = document.getElementById('btn-close-modal');
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
function setupExchange() {
    giveSlot.addEventListener('click', openSelectionModal);
    btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
    
    btnExchange.addEventListener('click', executeExchange);
}

function openSelectionModal() {
    modal.classList.remove('hidden');
    modalGrid.innerHTML = '';
    
    if (state.inventory.length === 0) {
        modalGrid.innerHTML = '<p style="text-align:center; width:100%;">You have no stickers to trade!</p>';
        return;
    }

    state.inventory.forEach((sticker, index) => {
        const el = document.createElement('div');
        el.className = 'sticker-item';
        el.innerHTML = `<img src="${sticker.src}" alt="Sticker">`;
        el.onclick = () => selectStickerToGive(index, sticker);
        modalGrid.appendChild(el);
    });
}

function selectStickerToGive(index, sticker) {
    selectedStickerIndex = index;
    
    // Update UI
    givePlaceholder.classList.add('hidden');
    giveImg.src = sticker.src;
    giveImg.classList.remove('hidden');
    
    modal.classList.add('hidden');
    btnExchange.disabled = false;
    
    // Reset receive slot
    receiveImg.classList.add('hidden');
    receiveImg.src = '';
}

function executeExchange() {
    if (selectedStickerIndex === null) return;

    btnExchange.disabled = true;
    btnExchange.innerText = "TRADING...";

    setTimeout(() => {
        // Remove old sticker
        state.inventory.splice(selectedStickerIndex, 1);
        
        // Get new random sticker
        const randomSticker = ASSETS[Math.floor(Math.random() * ASSETS.length)];
        state.inventory.push({
            id: Date.now(),
            src: randomSticker,
            date: new Date().toISOString()
        });
        
        saveState();

        // Show result
        receiveImg.src = randomSticker;
        receiveImg.classList.remove('hidden');
        
        btnExchange.innerText = "TRADE COMPLETE!";
        
        setTimeout(() => {
            // Reset UI
            selectedStickerIndex = null;
            giveImg.classList.add('hidden');
            givePlaceholder.classList.remove('hidden');
            btnExchange.innerText = "EXCHANGE!";
            btnExchange.disabled = true;
        }, 2000);

    }, 1500);
}

// Start
init();
