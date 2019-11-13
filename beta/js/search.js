// https://github.com/olivernn/lunr.js/issues/273
// https://gist.github.com/mwalters/81dc0ab448b11621514ed02c799a9536
// https://www.mattwalters.net/posts/hugo-and-lunr/#fnref:2
// https://www.josephearl.co.uk/post/static-sites-search-hugo/

(function() {
    let idx;
    let documents = [];
    const URL_LIST_POSTS = '/beta/blog/index.json';
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // Request and index documents
    fetch(URL_LIST_POSTS, {
        method: 'get'
    })
        .then(res => res.json())
        .then(res => {
            // Create index document with lunr
            idx = lunr(function() {
                this.ref('url');
                this.field('title');
                this.field('content');
                this.field('summary');

                res.forEach(function(doc) {
                    this.add(doc);
                    documents[doc.url] = {
                        title: doc.title,
                        content: doc.content,
                        summary: doc.summary
                    };
                }, this);
            });

            // Once data is loaded we can register handler
            registerSearchHandler();
        })
        .catch(err => {
            console.log({ err });
            searchResults.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                <p>Se ha producido un error.</p>
            </div>`;
        });

    ///////////////////////////////////////////////////////////

    function renderSearchResults(results) {
        // If results are empty
        if (results.length === 0) {
            searchResults.innerHTML = `
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                <p>No se han encontrado coindidencias en la búsqueda.</p>
            </div>
            `;
            return;
        }

        // Show max 10 results
        if (results.length > 9) {
            results = results.slice(0, 10);
        }

        // Reset search results
        searchResults.innerHTML = '';

        // Append results
        results.forEach(result => {
            // Create result item
            let article = document.createElement('article');
            article.classList.add('mb-8');
            article.innerHTML = `
                <a href="${result.ref}" class="block group">
                    <h2 class="article-title group-hover:text-green-500 pb-1">${documents[result.ref].title}</h2>
                    <div class="text-gray-700"><p>${documents[result.ref].summary}</p></div>
                </a>
                `;
            searchResults.appendChild(article);
        });
    }

    function registerSearchHandler() {
        // Register on input event
        searchInput.oninput = function(event) {
            if (searchInput.value === '') {
                searchResults.innerHTML = '';
                return;
            }

            // Get input value
            const query = event.target.value;

            // Run fuzzy search
            const results = idx.query(function(q) {
                q.term(lunr.tokenizer(query.trim()), { usePipeline: true, boost: 100 });
                q.term(lunr.tokenizer(query.trim()) + '*', { usePipeline: false, boost: 10 });
                q.term(lunr.tokenizer(query.trim()), { usePipeline: false, editDistance: 1 });
            });

            // Render results
            renderSearchResults(results);
        };

        searchInput.placeholder = 'Introduce término de búsqueda';
    }
})();
