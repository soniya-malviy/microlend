if (!requireAuth()) throw new Error('auth');

renderAppShell('loans');

fetchAPI('/loans')
  .then(({ loans }) => {
    document.getElementById('loans-body').innerHTML = loanRowsHtml(loans);
  })
  .catch((err) => showNotification(err.message, 'error'));
