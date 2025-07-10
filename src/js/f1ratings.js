document.addEventListener('DOMContentLoaded', () => {
  initTables(); 
  initSectionToggle();

  document.addEventListener('click', e => {
    if (e.target.classList.contains('prev-btn')) {
      handlePagination(e.target, -1);
    } else if (e.target.classList.contains('next-btn')) {
      handlePagination(e.target, 1);
    }
  });
});

function initTables() {
  loadTableData('current-grid-drivers', '/resources/text/f1ratings-current-grid-drivers.txt');
  loadTableData('current-grid-teams', '/resources/text/f1ratings-current-grid-teams.txt');
  loadTableData('all-time-drivers', '/resources/text/f1ratings-all-time-drivers.txt');
  loadTableData('all-time-teams', '/resources/text/f1ratings-all-time-teams.txt');
}

function hideSection(section) {
  section.style.animation = 'fadeIn 0.1s reverse forwards';
}

function showSection(section) {
  section.style.animation = 'fadeIn 0.1s forwards';
}

function collapseSection(section) {
  document.querySelectorAll('.section').forEach(s => {
    if (s !== section) {
      showSection(s);
    }
  });
  section.classList.remove('expanded');
}

function expandSection(section) {
  document.querySelectorAll('.section').forEach(s => {
    if (s !== section) {
      hideSection(s);
    }
  });
  section.classList.add('expanded');
}

function initSectionToggle() {
  ['current-grid-section', 'all-time-section'].forEach(id => {
    const section = document.getElementById(id);

    section.addEventListener('click', e => {
      if (e.target.closest('.content') || e.target.closest('.pagination')) return;

      if (section.classList.contains('expanded')) {
        collapseSection(section);
      } else {
        document.querySelectorAll('.section.expanded').forEach(collapseSection);
        expandSection(section);
      }
    });
  });
}

function loadTableData(containerId, filePath) {
  fetch(filePath)
    .then(resp => {
      if (!resp.ok) throw new Error(`Failed to load ${filePath}`);
      return resp.text();
    })
    .then(text => {
      const container = document.getElementById(containerId);
      container.innerHTML = '';

      const lines = text.trim().split('\n');
      if (lines.length === 0) return;

      const headers = lines[0].split('\t');
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('\t');
        if (cells.length !== headers.length) continue;
        const row = document.createElement('tr');

        cells.forEach((cell, idx) => {
          const td = document.createElement('td');
          const trimmed = cell.trim();
          const unquoted = trimmed.replace(/^["']|["']$/g, ''); // Strip outer quotes

          if (headers[idx].toLowerCase().includes('img')) {
            if (unquoted.startsWith('<')) {
              td.innerHTML = unquoted;
            } else {
              const img = document.createElement('img');
              img.src = unquoted;
              img.alt = headers[idx];
              img.onerror = () => {
                const fallback = document.createElement('div');
                fallback.style.width = '80px';
                fallback.style.height = '80px';
                fallback.style.backgroundColor = '#fff';
                fallback.style.display = 'flex';
                fallback.style.alignItems = 'center';
                fallback.style.justifyContent = 'center';
                fallback.style.color = '#333';
                fallback.style.fontSize = '12px';
                fallback.textContent = 'No image';
                img.replaceWith(fallback);
              };
              td.appendChild(img);
            }
          } else {
            td.textContent = unquoted;
          }

          row.appendChild(td);
        });

        tbody.appendChild(row);
      }

      container.appendChild(table);
      table.appendChild(tbody);
      fixColumnWidths(table);
      initPagination(container);
    })
    .catch(err => {
      console.error(err);
      const container = document.getElementById(containerId);
      container.textContent = 'Error loading data.';
    });
}

function initPagination(container) {
  const rows = container.querySelectorAll('tbody tr');
  const pagination = container.nextElementSibling;
  const pageInfo = pagination.querySelector('.page-info');

  rows.forEach(r => r.style.display = '');
  const rowHeight = rows[0]?.offsetHeight || 40;

  const containerHeight = 500;
  const rowsPerPage = Math.floor(containerHeight / rowHeight);

  rows.forEach(r => r.style.display = 'none');

  const pageCount = Math.ceil(rows.length / rowsPerPage);

  container.dataset.rowsPerPage = rowsPerPage;
  container.dataset.currentPage = 1;
  container.dataset.pageCount = pageCount;

  pageInfo.textContent = `Page 1 of ${pageCount}`;
  updatePaginationButtons(pagination, 1, pageCount);
  showPage(container, 1);
}

function showPage(container, page) {
  const rows = container.querySelectorAll('tbody tr');
  const pagination = container.nextElementSibling;
  const pageInfo = pagination.querySelector('.page-info');
  const rowsPerPage = +container.dataset.rowsPerPage;
  const pageCount = +container.dataset.pageCount;

  rows.forEach(r => (r.style.display = 'none'));
  const start = (page - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, rows.length);

  for (let i = start; i < end; i++) {
    rows[i].style.display = '';
  }

  container.dataset.currentPage = page;
  pageInfo.textContent = `Page ${page} of ${pageCount}`;
  updatePaginationButtons(pagination, page, pageCount);
}

function handlePagination(button, direction) {
  const pagination = button.closest('.pagination');
  const container = pagination.previousElementSibling;
  const current = +container.dataset.currentPage;
  const pageCount = +container.dataset.pageCount;
  const nextPage = current + direction;

  if (nextPage >= 1 && nextPage <= pageCount) {
    showPage(container, nextPage);
  }
}

function updatePaginationButtons(pagination, current, pageCount) {
  const prev = pagination.querySelector('.prev-btn');
  const next = pagination.querySelector('.next-btn');
  prev.disabled = current === 1;
  next.disabled = current === pageCount;
}

function fixColumnWidths(table) {
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  rows.forEach(row => row.style.display = '');

  const columnCount = table.rows[0].cells.length;
  const maxWidths = new Array(columnCount).fill(0);

  rows.forEach(row => {
    row.querySelectorAll('td').forEach((cell, i) => {
      const width = cell.scrollWidth;
      if (width > maxWidths[i]) maxWidths[i] = width;
    });
  });

  table.querySelectorAll('thead th').forEach((th, i) => {
    th.style.width = `${maxWidths[i]}px`;
  });
  table.querySelectorAll('tbody td').forEach((td, i) => {
    td.style.width = `${maxWidths[i % columnCount]}px`;
  });

  const container = table.closest('.table-container');
  const currentPage = +container.dataset.currentPage || 1;
  showPage(container, currentPage);
}