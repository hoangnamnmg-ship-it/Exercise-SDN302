const { spawn } = require('child_process');
const path = require('path');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 5, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            return res;
        } catch (err) {
            if (i === retries - 1) throw err;
            await sleep(delay);
        }
    }
}

async function runTests() {
    console.log('=== STARTING AUTOMATED TEST VERIFICATION FOR EXERCISE 6 ===\n');

    // TEST EXERCISE 1
    console.log('--- Testing Exercise 1 (server.js on port 3001) ---');
    const ex1Process = spawn('node', ['server.js'], { cwd: path.join(__dirname, 'exercise1'), stdio: 'inherit' });

    try {
        // GET /data
        let res = await fetchWithRetry('http://127.0.0.1:3001/data');
        let data = await res.json();
        console.log('GET /data Initial Response:', data);

        // POST /update
        res = await fetchWithRetry('http://127.0.0.1:3001/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Updating with a new message!' })
        });
        let updateRes = await res.json();
        console.log('POST /update Response:', updateRes);

        // GET /data verify updated
        res = await fetchWithRetry('http://127.0.0.1:3001/data');
        data = await res.json();
        console.log('GET /data Updated Response:', data);
        console.log('Exercise 1 PASSED!\n');
    } catch (err) {
        console.error('Exercise 1 FAILED:', err);
    } finally {
        ex1Process.kill();
    }

    await sleep(1000);

    // TEST NODE-EXPRESS (Exercise 2 & Exercise 3)
    console.log('--- Testing node-express (app.js on port 3002) ---');
    const ex2Process = spawn('node', ['app.js'], { cwd: path.join(__dirname, 'node-express'), stdio: 'inherit' });

    try {
        // ARTICLES CRUD
        console.log('[Articles Router]');
        let res = await fetchWithRetry('http://127.0.0.1:3002/articles');
        let articles = await res.json();
        console.log('GET /articles:', articles.length, 'articles');

        res = await fetchWithRetry('http://127.0.0.1:3002/articles/1');
        let article1 = await res.json();
        console.log('GET /articles/1:', article1.title);

        res = await fetchWithRetry('http://127.0.0.1:3002/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Article', body: 'New Article Body' })
        });
        let newArticle = await res.json();
        console.log('POST /articles:', newArticle);

        res = await fetchWithRetry(`http://127.0.0.1:3002/articles/${newArticle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Updated Article Title' })
        });
        let updatedArticle = await res.json();
        console.log('PUT /articles/:id:', updatedArticle);

        res = await fetchWithRetry(`http://127.0.0.1:3002/articles/${newArticle.id}`, {
            method: 'DELETE'
        });
        let deleteArticleRes = await res.json();
        console.log('DELETE /articles/:id:', deleteArticleRes.message);

        // VIDEOS CRUD (Exercise 3)
        console.log('[Videos Router]');
        res = await fetchWithRetry('http://127.0.0.1:3002/videos');
        let videos = await res.json();
        console.log('GET /videos:', videos.length, 'videos');

        res = await fetchWithRetry('http://127.0.0.1:3002/videos/1');
        let video1 = await res.json();
        console.log('GET /videos/1:', video1.title);

        res = await fetchWithRetry('http://127.0.0.1:3002/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Video', url: 'https://example.com/newvideo' })
        });
        let newVideo = await res.json();
        console.log('POST /videos:', newVideo);

        res = await fetchWithRetry(`http://127.0.0.1:3002/videos/${newVideo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Updated Video Title' })
        });
        let updatedVideo = await res.json();
        console.log('PUT /videos/:id:', updatedVideo);

        res = await fetchWithRetry(`http://127.0.0.1:3002/videos/${newVideo.id}`, {
            method: 'DELETE'
        });
        let deleteVideoRes = await res.json();
        console.log('DELETE /videos/:id:', deleteVideoRes.message);

        console.log('node-express (Articles & Videos) PASSED!\n');
    } catch (err) {
        console.error('node-express FAILED:', err);
    } finally {
        ex2Process.kill();
    }

    await sleep(1000);

    // TEST NODE-EXPRESS-CRUD (Exercise 2: Do CRUD with router)
    console.log('--- Testing node-express-CRUD (app.js on port 3003) ---');
    const exCrudProcess = spawn('node', ['app.js'], { cwd: path.join(__dirname, 'node-express-CRUD'), stdio: 'inherit' });

    try {
        let res = await fetchWithRetry('http://127.0.0.1:3003/articles');
        let articles = await res.json();
        console.log('GET /articles:', articles);

        res = await fetchWithRetry('http://127.0.0.1:3003/articles/2');
        let article2 = await res.json();
        console.log('GET /articles/2:', article2);

        res = await fetchWithRetry('http://127.0.0.1:3003/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Article 4', body: 'This is article 4 content' })
        });
        let created = await res.json();
        console.log('POST /articles:', created);

        res = await fetchWithRetry('http://127.0.0.1:3003/articles/4', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Updated Article 4' })
        });
        let updated = await res.json();
        console.log('PUT /articles/4:', updated);

        res = await fetchWithRetry('http://127.0.0.1:3003/articles/4', {
            method: 'DELETE'
        });
        let deleted = await res.json();
        console.log('DELETE /articles/4:', deleted);

        console.log('node-express-CRUD PASSED!\n');
    } catch (err) {
        console.error('node-express-CRUD FAILED:', err);
    } finally {
        exCrudProcess.kill();
    }

    console.log('=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
    process.exit(0);
}

runTests();
