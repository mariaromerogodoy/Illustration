document.getElementById('A').addEventListener('click', function() {
    const fullText = document.querySelector('.text');
    const summary = document.getElementById('CorrectHidden');

    if (summary.style.display === 'block') {
      summary.style.display = 'none';
      fullText.style.display = 'block';
    } else {
      summary.style.display = 'block';
      fullText.style.display = 'none';
    }
  });