(() => {
    const STORAGE_KEY = 'acityLostFoundItems';
    const message = document.getElementById('message');
    const itemsContainer = document.getElementById('items');
    const claimDialog = document.getElementById('claim-dialog');
    const claimForm = document.getElementById('claim-form');
    const claimItemName = document.getElementById('claim-item-name');
    const claimAnswer = document.getElementById('claim-answer');
    const claimFeedback = document.getElementById('claim-feedback');

    function createDetail(label, value) {
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value || 'Not provided';
        return [term, description];
    }

    function createItemCard(item) {
        const card = document.createElement('article');
        card.className = 'item-card';

        const heading = document.createElement('h2');
        heading.textContent = item.name || 'Unnamed item';
        card.appendChild(heading);

        const type = document.createElement('p');
        type.className = 'item-type';
        type.textContent = item.type === 'found' ? 'Found item' : 'Lost item';
        card.appendChild(type);

        if (item.image) {
            const image = document.createElement('img');
            image.className = 'item-image';
            image.src = item.image;
            image.alt = `Photo of ${item.name || 'reported item'}`;
            card.appendChild(image);
        }

        const details = document.createElement('dl');
        details.className = 'item-details';
        [
            ...createDetail('Description', item.description),
            ...createDetail('Date', item.date),
            ...createDetail('Category', item.category),
            ...createDetail('Location', item.location)
        ].forEach((element) => details.appendChild(element));
        card.appendChild(details);

        const claimButton = document.createElement('button');
        claimButton.className = 'claim-button';
        claimButton.type = 'button';
        claimButton.textContent = 'Claim';
        claimButton.addEventListener('click', () => {
            claimItemName.textContent = `Item: ${item.name || 'Unnamed item'}`;
            claimFeedback.textContent = '';
            claimForm.reset();
            claimDialog.showModal();
            claimAnswer.focus();
        });
        card.appendChild(claimButton);

        return card;
    }

    document.getElementById('claim-cancel').addEventListener('click', () => {
        claimDialog.close();
    });

    claimForm.addEventListener('submit', (event) => {
        event.preventDefault();
        claimFeedback.textContent = 'Your response has been sent.';
        window.setTimeout(() => claimDialog.close(), 2000);
    });

    try {
        const storedItems = localStorage.getItem(STORAGE_KEY);
        const items = storedItems ? JSON.parse(storedItems) : [];
        if (!Array.isArray(items)) {
            throw new Error('Saved item data is not a list.');
        }

        if (items.length === 0) {
            message.textContent = 'There are no reported items yet.';
            return;
        }

        items.forEach((item) => itemsContainer.appendChild(createItemCard(item)));
        message.textContent = `${items.length} reported item${items.length === 1 ? '' : 's'}.`;
    } catch (error) {
        message.textContent = 'Could not load reported items. Please check the saved item data and try again.';
        message.setAttribute('role', 'alert');
        console.error('Failed to load reported items:', error);
    }
})();