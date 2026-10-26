(() => {
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
        const itemName = item.itemName ?? item.name ?? 'Unnamed item';
        const itemType = item.reportType ?? item.type ?? 'lost';
        const itemPhoto = item.photo ?? item.image ?? '';
        const itemLocation = item.location ?? '';

        const card = document.createElement('article');
        card.className = 'item-card';

        const heading = document.createElement('h2');
        heading.textContent = itemName;
        card.appendChild(heading);

        const type = document.createElement('p');
        type.className = 'item-type';
        type.textContent = itemType === 'found' ? 'Found item' : 'Lost item';
        card.appendChild(type);

        if (itemPhoto) {
            const image = document.createElement('img');
            image.className = 'item-image';
            image.src = itemPhoto;
            image.alt = `Photo of ${itemName}`;
            image.loading = 'lazy';
            card.appendChild(image);
        }

        const details = document.createElement('dl');
        details.className = 'item-details';
        const dateLabel = itemType === 'found' ? 'Date found' : 'Date lost';
        [
            ...createDetail('Reference ID', item.referenceId),
            ...createDetail('Status', item.status),
            ...createDetail('Description', item.description),
            ...createDetail(dateLabel, formatDate(item.date)),
            ...createDetail('Category', item.category),
            ...createDetail('Location', itemLocation || getLocationText(item)),
            ...(itemType === 'found'
                ? createDetail('Hand-off location', item.handoffLocation)
                : [])
        ].forEach((element) => details.appendChild(element));
        card.appendChild(details);

        const claimButton = document.createElement('button');
        claimButton.className = 'claim-button';
        claimButton.type = 'button';
        claimButton.textContent = 'Claim';
        claimButton.addEventListener('click', () => {
            claimItemName.textContent = `Item: ${item.itemName ?? item.name ?? 'Unnamed item'}`;
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
        const items = getAllReports();
        if (!Array.isArray(items)) {
            throw new Error('Saved report data is not a list.');
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