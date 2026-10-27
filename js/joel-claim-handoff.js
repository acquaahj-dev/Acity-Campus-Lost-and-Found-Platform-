(function () {
    const root = document.getElementById('claim-handoff');
    if (!root) return;

    const steps = root.querySelectorAll('.claim__step');
    const label = document.getElementById('claim-progress-label');
    const bar = document.getElementById('claim-bar');
    const fill = document.getElementById('claim-bar-fill');
    const resetBtn = document.getElementById('claim-reset');

    function updateProgress() {
        const done = root.querySelectorAll('.claim__step.is-done').length;
        label.textContent = done + ' of ' + steps.length + ' steps done';
        fill.style.width = (done / steps.length * 100) + '%';
        bar.setAttribute('aria-valuenow', String(done));
    }

    function setOpen(step, open) {
        const toggle = step.querySelector('.claim__toggle');
        const body = step.querySelector('.claim__body');
        toggle.setAttribute('aria-expanded', String(open));
        body.hidden = !open;
    }

    steps.forEach(function (step, index) {
        const toggle = step.querySelector('.claim__toggle');
        const doneBtn = step.querySelector('.claim__done');

        toggle.addEventListener('click', function () {
            setOpen(step, toggle.getAttribute('aria-expanded') !== 'true');
        });

        doneBtn.addEventListener('click', function () {
            const nowDone = step.classList.toggle('is-done');
            doneBtn.textContent = nowDone ? 'Undo' : 'Mark step done';

            if (nowDone) {
                setOpen(step, false);
                if (steps[index + 1]) setOpen(steps[index + 1], true);
            }

            updateProgress();
        });
    });

    resetBtn.addEventListener('click', function () {
        steps.forEach(function (step) {
            step.classList.remove('is-done');
            step.querySelector('.claim__done').textContent = 'Mark step done';
            setOpen(step, false);
        });
        setOpen(steps[0], true);
        updateProgress();
    });

    updateProgress();
})();