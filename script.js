// ===== RT_SYNTAXTLAB — SITE SCRIPTS =====

document.addEventListener('DOMContentLoaded', function () {
    initNavToggle();
    initProgressTracker();
    initScrollSpy();
    initCopyButtons();
    initBackToTop();
    addCardHoverTilt();
});

/* ---------- Mobile navbar toggle ---------- */
function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ---------- Progress tracker (per-page, localStorage) ---------- */
function initProgressTracker() {
    const progressFill = document.querySelector('.progress-fill');
    const percentSpan = document.querySelector('.progress-percent');
    const resetBtn = document.querySelector('.reset-btn');
    if (!progressFill) return;

    const pageKey = getPageIdentifier();
    const storageKey = `syntaxlab_viewed_${pageKey}`;
    let viewedTopics = [];
    try { viewedTopics = JSON.parse(localStorage.getItem(storageKey)) || []; } catch (e) { viewedTopics = []; }

    const topics = document.querySelectorAll('.topic-section');
    if (topics.length === 0) return;

    topics.forEach((topic, index) => {
        const topicId = `topic_${pageKey}_${index}`;
        topic.setAttribute('data-topic-id', topicId);
        if (viewedTopics.includes(topicId)) topic.classList.add('viewed');
    });

    syncSidebarChecks(viewedTopics);
    updateProgressBar(viewedTopics.length, topics.length, progressFill, percentSpan);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const topic = entry.target;
                const topicId = topic.getAttribute('data-topic-id');
                if (topicId && !viewedTopics.includes(topicId)) {
                    viewedTopics.push(topicId);
                    try { localStorage.setItem(storageKey, JSON.stringify(viewedTopics)); } catch (e) {}
                    topic.classList.add('viewed');
                    syncSidebarChecks(viewedTopics);
                    updateProgressBar(viewedTopics.length, topics.length, progressFill, percentSpan);
                    showProgressToast(viewedTopics.length, topics.length);
                }
            }
        });
    }, { threshold: 0.5 });

    topics.forEach(topic => observer.observe(topic));

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all progress for this language? Your viewed topics will be cleared.')) {
                localStorage.removeItem(storageKey);
                viewedTopics = [];
                topics.forEach(topic => topic.classList.remove('viewed'));
                syncSidebarChecks(viewedTopics);
                updateProgressBar(0, topics.length, progressFill, percentSpan);
                showResetMessage();
            }
        });
    }
}

function syncSidebarChecks(viewedTopics) {
    const items = document.querySelectorAll('.topic-list li');
    items.forEach((li, idx) => {
        const topicId = `topic_${getPageIdentifier()}_${idx}`;
        li.classList.toggle('viewed', viewedTopics.includes(topicId));
    });
}

function getPageIdentifier() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    return pageName || 'home';
}

function updateProgressBar(viewed, total, progressFill, percentSpan) {
    const percent = total > 0 ? (viewed / total) * 100 : 0;
    progressFill.style.width = percent + '%';
    if (percentSpan) percentSpan.innerText = Math.round(percent) + '%';
}

function showProgressToast(viewed, total) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = `📚 Progress: ${viewed}/${total} topics completed!`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 2000);
}

function showResetMessage() {
    const toast = document.createElement('div');
    toast.className = 'toast reset-toast';
    toast.innerText = '🔄 Progress reset! Start learning again.';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 2000);
}

/* ---------- Sidebar click-to-scroll + scroll-spy active highlight ---------- */
function initScrollSpy() {
    const items = document.querySelectorAll('.topic-list li');
    const sections = document.querySelectorAll('.topic-section');
    if (!items.length || !sections.length) return;

    items.forEach((item, idx) => {
        item.addEventListener('click', () => {
            const target = sections[idx];
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = Array.from(sections).indexOf(entry.target);
                items.forEach(li => li.classList.remove('active'));
                if (items[idx]) items[idx].classList.add('active');
            }
        });
    }, { threshold: 0.3, rootMargin: '-90px 0px -60% 0px' });

    sections.forEach(sec => spy.observe(sec));
}

/* ---------- Copy-to-clipboard for code blocks ---------- */
function initCopyButtons() {
    document.querySelectorAll('.code-block').forEach(block => {
        const pre = block.querySelector('pre');
        if (!pre) return;
        const header = document.createElement('div');
        header.className = 'code-block-header';
        const lang = block.getAttribute('data-lang') || 'code';
        header.innerHTML = `<span>${lang}</span>`;
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerText = 'Copy';
        btn.addEventListener('click', () => {
            const text = pre.innerText;
            navigator.clipboard.writeText(text).then(() => {
                btn.innerText = 'Copied!';
                setTimeout(() => (btn.innerText = 'Copy'), 1500);
            }).catch(() => { btn.innerText = 'Error'; });
        });
        header.appendChild(btn);
        block.insertBefore(header, pre);
    });
}

/* ---------- Back to top button ---------- */
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Subtle hover tilt for home cards ---------- */
function addCardHoverTilt() {
    const cards = document.querySelectorAll('.lang-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-6px)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; });
    });
}