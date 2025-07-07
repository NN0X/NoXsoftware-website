// Initialize tables and event listeners
function initTables() {
  // Load initial data
  loadTableData('current-grid-drivers', '/resources/text/f1ratings-current-grid-drivers.txt');
  loadTableData('current-grid-teams', '/resources/text/f1ratings-current-grid-teams.txt');
  loadTableData('all-time-drivers', '/resources/text/all-time-drivers.txt');
  loadTableData('all-time-teams', '/resources/text/all-time-teams.txt');
  
  // Store original positions
  document.querySelectorAll('.section').forEach(section => {
    const rect = section.getBoundingClientRect();
    section.style.setProperty('--original-top', `${rect.top}px`);
  });
  
  // Setup section click handlers
  document.querySelectorAll('.section').forEach(section => {
    section.addEventListener('click', function(e) {
      // Don't process clicks on content elements or pagination
      if (e.target.closest('.content') || e.target.closest('.pagination') || 
          e.target.closest('table') || e.target.tagName === 'IMG') {
        return;
      }
      
      if (this.classList.contains('expanded')) {
        // Collapse if already expanded
        this.classList.add('collapsing');
        this.classList.remove('expanded');
        
        // After animation completes
        setTimeout(() => {
          this.classList.remove('collapsing');
          document.getElementById('info').classList.remove('expanded');
          this.style.removeProperty('--original-top');
        }, 500);
      } else {
        // Update position before expanding
        const rect = this.getBoundingClientRect();
        this.style.setProperty('--original-top', `${rect.top}px`);
        
        // Collapse any expanded section
        document.querySelectorAll('.section.expanded').forEach(expandedSection => {
          expandedSection.classList.add('collapsing');
          expandedSection.classList.remove('expanded');
          
          setTimeout(() => {
            expandedSection.classList.remove('collapsing');
          }, 500);
        });
        
        // Expand clicked section
        this.classList.add('expanded');
        document.getElementById('info').classList.add('expanded');
      }
    });
  });
  
  // Setup pagination event delegation
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('prev-btn')) {
      handlePagination(e.target, -1);
    } else if (e.target.classList.contains('next-btn')) {
      handlePagination(e.target, 1);
    }
  });
}

// Load table data from text files
function loadTableData(containerId, filePath) {
  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      
      // Parse tab-delimited data
      const rows = data.trim().split('\n');
      if (rows.length === 0) return;
      
      const headers = rows[0].split('\t');
      
      // Create table
      const table = document.createElement('table');
      
      // Create header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create body
      const tbody = document.createElement('tbody');
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');
        if (cells.length !== headers.length) continue;
        
        const row = document.createElement('tr');
        
        cells.forEach((cell, index) => {
          const td = document.createElement('td');
          
          // Handle image columns
          if (headers[index].toLowerCase().includes('img')) {
            const img = document.createElement('img');
            img.src = cell.trim();
            img.alt = headers[index];
            td.appendChild(img);
          } else {
            td.textContent = cell;
          }
          
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      container.appendChild(table);
      
      // Initialize pagination
      initPagination(container);
    })
    .catch(error => {
      console.error('Error loading table data:', error);
      const container = document.getElementById(containerId);
      container.textContent = 'Error loading data. Please try again later.';
    });
}

// Initialize pagination for a table container
function initPagination(container) {
  const table = container.querySelector('table');
  if (!table) return;
  
  const rows = table.querySelectorAll('tbody tr');
  const pagination = container.nextElementSibling;
  const pageInfo = pagination.querySelector('.page-info');
  
  const rowsPerPage = 10;
  const pageCount = Math.ceil(rows.length / rowsPerPage);
  
  // Store pagination state
  container.dataset.rowsPerPage = rowsPerPage;
  container.dataset.currentPage = '1';
  container.dataset.pageCount = pageCount;
  container.dataset.totalRows = rows.length;
  
  // Update page info
  pageInfo.textContent = `Page 1 of ${pageCount}`;
  
  // Update button states
  updatePaginationButtons(pagination, 1, pageCount);
  
  // Show first page
  showPage(container, 1);
}

// Show specific page of a table
function showPage(container, page) {
  const table = container.querySelector('table');
  const rows = table.querySelectorAll('tbody tr');
  const pagination = container.nextElementSibling;
  const pageInfo = pagination.querySelector('.page-info');
  const rowsPerPage = parseInt(container.dataset.rowsPerPage);
  const pageCount = parseInt(container.dataset.pageCount);
  
  // Hide all rows
  rows.forEach(row => row.style.display = 'none');
  
  // Show rows for current page
  const start = (page - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, rows.length);
  
  for (let i = start; i < end; i++) {
    rows[i].style.display = '';
  }
  
  // Update pagination info
  container.dataset.currentPage = page;
  pageInfo.textContent = `Page ${page} of ${pageCount}`;
  
  // Update button states
  updatePaginationButtons(pagination, page, pageCount);
}

// Handle pagination button clicks
function handlePagination(button, direction) {
  const pagination = button.closest('.pagination');
  const container = pagination.previousElementSibling;
  const currentPage = parseInt(container.dataset.currentPage);
  const pageCount = parseInt(container.dataset.pageCount);
  
  const newPage = currentPage + direction;
  
  if (newPage >= 1 && newPage <= pageCount) {
    showPage(container, newPage);
  }
}

// Update pagination button states
function updatePaginationButtons(pagination, currentPage, pageCount) {
  const prevBtn = pagination.querySelector('.prev-btn');
  const nextBtn = pagination.querySelector('.next-btn');
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === pageCount;
}

// Close expanded sections when clicking outside
document.addEventListener('click', function(e) {
  const section = e.target.closest('.section');
  const project = e.target.closest('.Project');
  const github = e.target.closest('.GitHub');
  
  if (!section && !project && !github) {
    document.querySelectorAll('.section.expanded').forEach(section => {
      section.classList.add('collapsing');
      section.classList.remove('expanded');
      
      setTimeout(() => {
        section.classList.remove('collapsing');
        document.getElementById('info').classList.remove('expanded');
      }, 500);
    });
  }
});