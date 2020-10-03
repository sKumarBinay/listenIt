
// Make sure sw are supported
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker
//             .register('/sw')
//             .catch(err => console.log(`Service Worker: Error: ${err}`))
//     })
// }

window.binay = window.binay || {}
window.binay.listenIt = window.binay.listenIt || {}

const file = document.querySelector('#file')
const notification = document.querySelector('.notification')
const pageList = document.querySelector('.image-list')
const allDoneBtn = document.querySelector('.all-done')
const bookList = document.querySelector('.book-list')
const bookName = document.querySelector('#book-name')
const inputTxt = document.querySelector('.txt');
const profileOpen = document.querySelector('.profile-open')
const profileClose = document.querySelector('.profile-close')
const profile = document.querySelector('.user-profile')
const prompt = document.querySelector('.install-prompt-wrapper')
const y = document.querySelector('.yes')
const n = document.querySelector('.no')
const synth = window.speechSynthesis;
const speak = document.querySelector('#speak');
const voiceSelect = document.querySelector('select');
const pitch = document.querySelector('#pitch');
const rate = document.querySelector('#rate');
let voices = [];

window.onload = () => {
    if (!localStorage.getItem('listenIt.appInstalled') === 'true') {
        prompt.classList.remove('d-none')
    }
}
n.addEventListener('click', () => {
    prompt.classList.add('d-none')
})

window.addEventListener('beforeinstallprompt', (e) => {
    localStorage.setItem('listenIt.appInstalled', 'false')
    prompt.classList.remove('d-none')
    e.preventDefault()
    deferredPrompt = e
    y.addEventListener('click', () => {
        prompt.classList.add('d-none')
        deferredPrompt.prompt()
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                localStorage.setItem('listenIt.appInstalled', 'true')
            }
        })
    })
})


file.addEventListener('change', (e) => {
    toggleNotification(true)
    const data = new FormData()
    data.append('scan', e.target.files[0])
    fetch('/upload',
        {
            method: 'POST',
            body: data
        })
        .then(res => res.text())
        .then(res => {
            let currentBook
            const listenIt = JSON.parse(window.localStorage.getItem('listenIt'))
            if (!listenIt.lastWorkComplete) currentBook = listenIt.lastBook
            const data = JSON.parse(window.localStorage.getItem(currentBook))
            data.currentPage += 1
            const pageNo = data.currentPage
            data.pages[pageNo] = res
            window.localStorage.setItem(currentBook, JSON.stringify(data))
            appendPage(pageNo, res)
            toggleNotification(false)
        })
})

function appendPage(pageNo, content) {
    const div = document.createElement('div')
    div.innerHTML = `<div class="image">
        <div class="page-count">${pageNo}</div>
        <span class="partial-string">${content}</span>
    </div>`
    const page = div.firstChild
    page.onclick = openPreview
    pageList.appendChild(page)
}
function openPreview() {

}

function populateVoiceList() {
    voices = synth.getVoices();

    for (i = 0; i < voices.length; i++) {
        const option = document.createElement('option');
        option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

        if (voices[i].default) {
            option.textContent += ' -- DEFAULT';
        }

        option.setAttribute('data-lang', voices[i].lang);
        option.setAttribute('data-name', voices[i].name);
        voiceSelect.appendChild(option);
    }
}
populateVoiceList();

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// speak.onclick = function(event) {
//   event.preventDefault();



//   inputTxt.blur();
// }

profileOpen.onclick = () => {
    onOpenProfile()
}

profileClose.onclick = () => {
    profile.classList.add('d-none')
}

bookName.onchange = (e) => {
    const choice = confirm("Confirm your book name. Note you can't rename once confirmed.")
    if (choice) {
        bookName.disabled = true
        const data = {
            currentPage: 0,
            pages: {},
            completeBook: ''
        }
        const trackLeftWork = {
            lastWorkComplete: false,
            lastBook: `listenIt-${e.target.value.replace(/ /g, '-')}`,
            preference: {},
            books: {}
        }
        const book = window.localStorage.getItem(`listenIt-${e.target.value.replace(/ /g, '-')}`)
        if (!book) {
            window.localStorage.removeItem(`listenIt-${e.target.value.replace(/ /g, '-')}`)
        }
        window.localStorage.setItem(`listenIt-${e.target.value.replace(/ /g, '-')}`, JSON.stringify(data))
        window.localStorage.setItem('listenIt', JSON.stringify(trackLeftWork))
    }
}

allDoneBtn.onclick = () => {
    const listenIt = JSON.parse(window.localStorage.getItem('listenIt'))
    const data = JSON.parse(window.localStorage.getItem(listenIt.lastBook))
    data.completeBook = Object.values(data.pages).join()
    window.localStorage.removeItem(listenIt.lastBook)

    listenIt.lastWorkComplete = true
    listenIt.lastBook = listenIt.lastBook
    listenIt.books[listenIt.lastBook] = data.completeBook
    window.localStorage.setItem('listenIt', JSON.stringify(listenIt))
    resetHome()
    onOpenProfile()
}
function resetHome () {
    bookList.disabled = false
    bookName.value = ''
    pageList.innerHTML = ''
    file.value = null
}

function onOpenProfile () {
    profile.classList.remove('d-none')
    const listenIt = JSON.parse(window.localStorage.getItem('listenIt'))
    const books = Object.keys(listenIt.books)
    books.forEach(b => {
        const div = document.createElement('div')
    div.innerHTML = `<div class="book">${b.split('listenIt')[1].replace(/-/g, ' ')}</div>`
    const book = div.firstChild
    book.onclick = () => onPlay(listenIt.books[b])
    bookList.appendChild(book)
    })
}

function onPlay (content) {
    const utterThis = new SpeechSynthesisUtterance(content);
    const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
    for(i = 0; i < voices.length ; i++) {
      if(voices[i].name === selectedOption) {
        utterThis.voice = voices[i];
      }
    }
    utterThis.pitch = pitch.value;
    utterThis.rate = rate.value;
    synth.speak(utterThis);
}

function toggleNotification (show=true) {
    show ? notification.classList.add('show') : notification.classList.remove('show')
}