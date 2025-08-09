/**
 * Advanced Table Enhancement - Searchable, Filterable, Sortable Tables
 * Optimized for Bat Digest swing weight data with mobile-first design
 */

class AdvancedTable {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            searchPlaceholder: 'Search bats by brand, name, length, weight...',
            enableExport: true,
            enableStats: true,
            enableAdvancedFilters: true,
            mobileBreakpoint: 768,
            ...options
        };
        
        this.originalData = [];
        this.filteredData = [];
        this.currentSort = { column: null, direction: 'asc' };
        
        // Pagination settings
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.showAllMode = false;
        this.filters = {};
        this.initialized = false;
        
        // Don't auto-init here - wait for loadData
    }
    
    init() {
        if (this.initialized) return;
        this.createSearchInterface();
        this.bindEvents();
        this.initialized = true;
    }
    
    createSearchInterface() {
        // Determine which quick filters to show based on the page
        const currentPath = window.location.pathname.toLowerCase();
        let quickFilterButtons = '';
        
        if (currentPath.includes('usssa') || currentPath.includes('usa')) {
            // USSSA and USA: 32", 31", 30"
            quickFilterButtons = `
                <button class="btn btn-primary btn-sm filter-btn" data-filter="brand" data-value="">
                    All Bats
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="32">
                    32"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="31">
                    31"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="30">
                    30"
                </button>
            `;
        } else if (currentPath.includes('fastpitch')) {
            // Fastpitch: 33", 32", 31"
            quickFilterButtons = `
                <button class="btn btn-primary btn-sm filter-btn" data-filter="brand" data-value="">
                    All Bats
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="33">
                    33"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="32">
                    32"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="31">
                    31"
                </button>
            `;
        } else if (currentPath.includes('bbcor')) {
            // BBCOR: 34", 33", 32"
            quickFilterButtons = `
                <button class="btn btn-primary btn-sm filter-btn" data-filter="brand" data-value="">
                    All Bats
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="34">
                    34"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="33">
                    33"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="32">
                    32"
                </button>
            `;
        } else {
            // General swing weights page: Show variety
            quickFilterButtons = `
                <button class="btn btn-primary btn-sm filter-btn" data-filter="brand" data-value="">
                    All Bats
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="33">
                    33"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="length" data-value="34">
                    34"
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="weight" data-value="30">
                    30oz
                </button>
                <button class="btn btn-secondary btn-sm filter-btn" data-filter="weight" data-value="31">
                    31oz
                </button>
            `;
        }
        
        const searchHTML = `
            <div class="advanced-table-controls mb-4">
                <!-- Main Search Bar -->
                <div class="search-section mb-3">
                    <div class="search-wrapper">
                        <input type="text" 
                               id="tableSearch" 
                               class="form-control search-input" 
                               placeholder="${this.options.searchPlaceholder}"
                               autocomplete="off">
                        <div class="search-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="search-clear" id="clearSearch" style="display: none;">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Filters & Advanced Toggle -->
                <div class="filters-section">
                    <div class="filter-controls mb-3">
                        <div class="quick-filters">
                            ${quickFilterButtons}
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-outline btn-sm" id="toggleAdvancedFilters">
                                <i class="fas fa-sliders-h"></i> Advanced
                            </button>
                            <button class="btn btn-outline btn-sm" id="exportData">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                    
                    <!-- Pagination Controls -->
                    <div class="pagination-controls mb-3">
                        <div class="items-per-page">
                            <label>Show: </label>
                            <select class="form-control form-control-sm d-inline-block" id="itemsPerPageSelect" style="width: auto;">
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="50">50 rows</option>
                                <option value="all">All rows</option>
                            </select>
                        </div>
                        
                        <div class="pagination-info" id="paginationInfo">
                            Showing 1-10 of 0 results
                        </div>
                        
                        <div class="pagination-buttons" id="paginationButtons">
                            <button class="btn btn-sm btn-outline" id="prevPage" disabled>
                                <i class="fas fa-chevron-left"></i> Previous
                            </button>
                            <span class="page-numbers" id="pageNumbers"></span>
                            <button class="btn btn-sm btn-outline" id="nextPage" disabled>
                                Next <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Advanced Filters Panel -->
                    <div class="advanced-filters-panel" id="advancedFilters" style="display: none;">
                        <div class="card">
                            <div class="card-body">
                                <div class="filter-grid">
                                    <div class="filter-group">
                                        <label class="form-label">Brand</label>
                                        <select class="form-control" id="filterBrand">
                                            <option value="">All Brands</option>
                                        </select>
                                    </div>
                                    <div class="filter-group">
                                        <label class="form-label">Length Range</label>
                                        <select class="form-control" id="filterLength">
                                            <option value="">All Lengths</option>
                                        </select>
                                    </div>
                                    <div class="filter-group">
                                        <label class="form-label">Weight Range</label>
                                        <select class="form-control" id="filterWeight">
                                            <option value="">All Weights</option>
                                        </select>
                                    </div>
                                    <div class="filter-group">
                                        <label class="form-label">Swing Weight Range</label>
                                        <div class="range-inputs">
                                            <input type="number" class="form-control" id="swingWeightMin" placeholder="Min">
                                            <input type="number" class="form-control" id="swingWeightMax" placeholder="Max">
                                        </div>
                                    </div>
                                </div>
                                <div class="filter-actions">
                                    <button class="btn btn-primary btn-sm" id="applyFilters">Apply Filters</button>
                                    <button class="btn btn-secondary btn-sm" id="clearFilters">Clear All</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Summary -->
                <div class="table-stats" id="tableStats">
                    <small class="text-muted">Ready to load data...</small>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('afterbegin', searchHTML);
    }
    
    bindEvents() {
        // Search input
        const searchInput = document.getElementById('tableSearch');
        const clearBtn = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', this.debounce((e) => {
            this.handleSearch(e.target.value);
            clearBtn.style.display = e.target.value ? 'block' : 'none';
        }, 300));
        
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            this.handleSearch('');
        });
        
        // Quick filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleQuickFilter(btn);
            });
        });
        
        // Advanced filters toggle
        document.getElementById('toggleAdvancedFilters').addEventListener('click', () => {
            const panel = document.getElementById('advancedFilters');
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        });
        
        // Advanced filter controls
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyAdvancedFilters();
        });
        
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        // Export functionality
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });
        
        // Pagination controls
        document.getElementById('itemsPerPageSelect').addEventListener('change', (e) => {
            if (e.target.value === 'all') {
                this.showAllMode = true;
                this.itemsPerPage = this.filteredData.length;
            } else {
                this.showAllMode = false;
                this.itemsPerPage = parseInt(e.target.value);
            }
            this.currentPage = 1;
            this.renderTable();
        });
        
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = this.getTotalPages();
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });
        
        // Mobile responsive handling
        this.handleResponsive();
        window.addEventListener('resize', () => this.handleResponsive());
    }
    
    loadData(data, headers) {
        // Initialize the interface only once
        if (!this.initialized) {
            this.init();
        }
        
        this.originalData = data.map((row, index) => ({
            id: index,
            data: row,
            headers: headers
        }));
        this.filteredData = [...this.originalData];
        
        this.populateFilterOptions();
        this.renderTable();
        this.updateStats();
    }
    
    populateFilterOptions() {
        if (!this.originalData.length) return;
        
        const headers = this.originalData[0].headers;
        const brandIndex = headers.findIndex(h => h.toLowerCase().includes('brand'));
        const lengthIndex = headers.findIndex(h => h.toLowerCase().includes('length'));
        const weightIndex = headers.findIndex(h => h.toLowerCase().includes('weight') && !h.toLowerCase().includes('swing'));
        
        // Populate brand filter
        if (brandIndex >= 0) {
            const brands = [...new Set(this.originalData.map(item => item.data[brandIndex]).filter(Boolean))].sort();
            const brandSelect = document.getElementById('filterBrand');
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });
        }
        
        // Populate length filter
        if (lengthIndex >= 0) {
            const lengths = [...new Set(this.originalData.map(item => item.data[lengthIndex]).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b));
            const lengthSelect = document.getElementById('filterLength');
            lengths.forEach(length => {
                const option = document.createElement('option');
                option.value = length;
                option.textContent = length + '"';
                lengthSelect.appendChild(option);
            });
        }
        
        // Populate weight filter
        if (weightIndex >= 0) {
            const weights = [...new Set(this.originalData.map(item => item.data[weightIndex]).filter(Boolean))].sort((a, b) => parseFloat(a) - parseFloat(b));
            const weightSelect = document.getElementById('filterWeight');
            weights.forEach(weight => {
                const option = document.createElement('option');
                option.value = weight;
                option.textContent = weight + 'oz';
                weightSelect.appendChild(option);
            });
        }
    }
    
    handleSearch(query) {
        if (!query.trim()) {
            this.filteredData = [...this.originalData];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredData = this.originalData.filter(item => {
                return item.data.some(cell => 
                    cell && cell.toString().toLowerCase().includes(searchTerm)
                );
            });
        }
        this.currentPage = 1; // Reset to first page when searching
        this.renderTable();
        this.updateStats();
    }
    
    handleQuickFilter(btn) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-secondary');
        });
        
        // Add active class to clicked button
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        
        const filterType = btn.dataset.filter;
        const filterValue = btn.dataset.value;
        
        console.log('Filter clicked:', filterType, filterValue);
        
        if (!filterValue) {
            this.filteredData = [...this.originalData];
        } else {
            const headers = this.originalData[0].headers;
            console.log('Available headers:', headers);
            
            const columnIndex = headers.findIndex(h => h.toLowerCase().includes(filterType));
            console.log('Found column index:', columnIndex, 'for filter type:', filterType);
            
            if (columnIndex >= 0) {
                console.log('Sample data in column:', this.originalData.slice(0, 3).map(item => item.data[columnIndex]));
                
                this.filteredData = this.originalData.filter(item => {
                    const cellValue = item.data[columnIndex];
                    if (!cellValue) return false;
                    
                    console.log('Comparing:', cellValue, 'with filter:', filterValue);
                    
                    // For numeric filters (length/weight), do proper numeric comparison
                    if (filterType === 'length' || filterType === 'weight') {
                        const cleanCellValue = String(cellValue).replace(/[^\d.]/g, '');
                        const cellNum = parseFloat(cleanCellValue);
                        const filterNum = parseFloat(filterValue);
                        
                        console.log('Numeric comparison:', cellNum, '===', filterNum, '=', cellNum === filterNum);
                        
                        return !isNaN(cellNum) && !isNaN(filterNum) && cellNum === filterNum;
                    } else {
                        // For text filters (brand), use includes
                        return cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                    }
                });
                
                console.log('Filtered results count:', this.filteredData.length);
            }
        }
        
        this.currentPage = 1; // Reset to first page when filtering
        this.renderTable();
        this.updateStats();
    }
    
    applyAdvancedFilters() {
        let filtered = [...this.originalData];
        const headers = this.originalData[0].headers;
        
        // Brand filter
        const brandValue = document.getElementById('filterBrand').value;
        if (brandValue) {
            const brandIndex = headers.findIndex(h => h.toLowerCase().includes('brand'));
            if (brandIndex >= 0) {
                filtered = filtered.filter(item => item.data[brandIndex] === brandValue);
            }
        }
        
        // Length filter
        const lengthValue = document.getElementById('filterLength').value;
        if (lengthValue) {
            const lengthIndex = headers.findIndex(h => h.toLowerCase().includes('length'));
            if (lengthIndex >= 0) {
                filtered = filtered.filter(item => {
                    const cellValue = item.data[lengthIndex];
                    if (!cellValue) return false;
                    const cleanCellValue = String(cellValue).replace(/[^\d.]/g, '');
                    const cellNum = parseFloat(cleanCellValue);
                    const filterNum = parseFloat(lengthValue);
                    return !isNaN(cellNum) && !isNaN(filterNum) && cellNum === filterNum;
                });
            }
        }
        
        // Weight filter
        const weightValue = document.getElementById('filterWeight').value;
        if (weightValue) {
            const weightIndex = headers.findIndex(h => h.toLowerCase().includes('weight') && !h.toLowerCase().includes('swing'));
            if (weightIndex >= 0) {
                filtered = filtered.filter(item => {
                    const cellValue = item.data[weightIndex];
                    if (!cellValue) return false;
                    const cleanCellValue = String(cellValue).replace(/[^\d.]/g, '');
                    const cellNum = parseFloat(cleanCellValue);
                    const filterNum = parseFloat(weightValue);
                    return !isNaN(cellNum) && !isNaN(filterNum) && cellNum === filterNum;
                });
            }
        }
        
        // Swing weight range
        const swingWeightMin = document.getElementById('swingWeightMin').value;
        const swingWeightMax = document.getElementById('swingWeightMax').value;
        if (swingWeightMin || swingWeightMax) {
            const swingWeightIndex = headers.findIndex(h => h.toLowerCase().includes('swing') && h.toLowerCase().includes('weight'));
            if (swingWeightIndex >= 0) {
                filtered = filtered.filter(item => {
                    const value = parseFloat(item.data[swingWeightIndex]);
                    if (isNaN(value)) return false;
                    
                    if (swingWeightMin && value < parseFloat(swingWeightMin)) return false;
                    if (swingWeightMax && value > parseFloat(swingWeightMax)) return false;
                    return true;
                });
            }
        }
        
        this.filteredData = filtered;
        this.currentPage = 1; // Reset to first page when applying filters
        this.renderTable();
        this.updateStats();
    }
    
    clearAllFilters() {
        // Clear advanced filter inputs
        document.getElementById('filterBrand').value = '';
        document.getElementById('filterLength').value = '';
        document.getElementById('filterWeight').value = '';
        document.getElementById('swingWeightMin').value = '';
        document.getElementById('swingWeightMax').value = '';
        
        // Clear search
        document.getElementById('tableSearch').value = '';
        document.getElementById('clearSearch').style.display = 'none';
        
        // Reset quick filters - activate the "All Bats" button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });
        const allBatsBtn = document.querySelector('.filter-btn[data-value=""]');
        if (allBatsBtn) {
            allBatsBtn.classList.remove('btn-secondary');
            allBatsBtn.classList.add('btn-primary');
        }
        
        this.filteredData = [...this.originalData];
        this.renderTable();
        this.updateStats();
    }
    
    sortTable(columnIndex) {
        const direction = this.currentSort.column === columnIndex && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        
        this.filteredData.sort((a, b) => {
            let aVal = a.data[columnIndex] || '';
            let bVal = b.data[columnIndex] || '';
            
            // Clean and try to parse as numbers (handles cases like "33" or "30oz")
            const aClean = String(aVal).replace(/[^\d.]/g, '');
            const bClean = String(bVal).replace(/[^\d.]/g, '');
            const aNum = parseFloat(aClean);
            const bNum = parseFloat(bClean);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                // Both are numbers, sort numerically
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            } else {
                // Fall back to string comparison
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
                if (direction === 'asc') {
                    return aVal.localeCompare(bVal);
                } else {
                    return bVal.localeCompare(aVal);
                }
            }
        });
        
        this.currentSort = { column: columnIndex, direction };
        this.renderTable();
    }
    
    renderTable() {
        const existingTable = this.container.querySelector('.enhanced-table-wrapper');
        if (existingTable) {
            existingTable.remove();
        }
        
        if (!this.filteredData.length) {
            this.container.insertAdjacentHTML('beforeend', `
                <div class="enhanced-table-wrapper">
                    <div class="text-center p-4">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No results found</h5>
                        <p class="text-muted">Try adjusting your search or filters</p>
                    </div>
                </div>
            `);
            return;
        }
        
        const headers = this.filteredData[0].headers;
        const isMobile = window.innerWidth < this.options.mobileBreakpoint;
        
        let tableHTML = `
            <div class="enhanced-table-wrapper">
                <div class="table-container">
                    <table class="table enhanced-table">
                        <thead class="table-header">
                            <tr>
        `;
        
        headers.forEach((header, index) => {
            const sortIcon = this.currentSort.column === index 
                ? (this.currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
                : 'fa-sort';
            
            tableHTML += `
                <th class="sortable-header" data-column="${index}">
                    ${header}
                    <i class="fas ${sortIcon} sort-icon"></i>
                </th>
            `;
        });
        
        tableHTML += `
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Apply pagination
        const paginatedData = this.getPaginatedData();
        paginatedData.forEach(item => {
            tableHTML += '<tr>';
            item.data.forEach(cell => {
                tableHTML += `<td>${cell || '-'}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('beforeend', tableHTML);
        
        // Update pagination controls
        this.updatePaginationControls();
        
        // Bind sort handlers
        this.container.querySelectorAll('.sortable-header').forEach(header => {
            header.addEventListener('click', () => {
                this.sortTable(parseInt(header.dataset.column));
            });
        });
    }
    
    // Pagination methods
    getTotalPages() {
        if (this.showAllMode) return 1;
        return Math.ceil(this.filteredData.length / this.itemsPerPage);
    }
    
    getPaginatedData() {
        if (this.showAllMode) {
            return this.filteredData;
        }
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.filteredData.slice(start, end);
    }
    
    updatePaginationControls() {
        const totalPages = this.getTotalPages();
        const totalItems = this.filteredData.length;
        const startItem = this.showAllMode ? 1 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = this.showAllMode ? totalItems : Math.min(this.currentPage * this.itemsPerPage, totalItems);
        
        // Update pagination info
        const paginationInfo = document.getElementById('paginationInfo');
        if (totalItems === 0) {
            paginationInfo.textContent = 'No results found';
        } else {
            paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} results`;
        }
        
        // Update items per page selector
        const itemsSelect = document.getElementById('itemsPerPageSelect');
        if (this.showAllMode) {
            itemsSelect.value = 'all';
        } else {
            itemsSelect.value = this.itemsPerPage.toString();
        }
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
        
        // Update page numbers
        this.updatePageNumbers(totalPages);
    }
    
    updatePageNumbers(totalPages) {
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.createPageButton(1, pageNumbers);
            if (startPage > 2) {
                pageNumbers.innerHTML += '<span class="page-ellipsis">...</span>';
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            this.createPageButton(i, pageNumbers);
        }
        
        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.innerHTML += '<span class="page-ellipsis">...</span>';
            }
            this.createPageButton(totalPages, pageNumbers);
        }
    }
    
    createPageButton(pageNum, container) {
        const button = document.createElement('button');
        button.className = `page-btn ${pageNum === this.currentPage ? 'active' : ''}`;
        button.textContent = pageNum;
        button.addEventListener('click', () => {
            this.currentPage = pageNum;
            this.renderTable();
        });
        container.appendChild(button);
    }
    
    updateStats() {
        const total = this.originalData.length;
        const filtered = this.filteredData.length;
        const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;
        
        const statsElement = document.getElementById('tableStats');
        statsElement.innerHTML = `
            <small class="text-muted">
                Showing ${filtered.toLocaleString()} of ${total.toLocaleString()} bats (${percentage}%)
                ${filtered !== total ? ' - <a href="#" id="clearAllFiltersLink">Clear filters</a>' : ''}
            </small>
        `;
        
        // Bind clear filters link
        const clearLink = document.getElementById('clearAllFiltersLink');
        if (clearLink) {
            clearLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearAllFilters();
            });
        }
    }
    
    exportData() {
        if (!this.filteredData.length) {
            alert('No data to export');
            return;
        }
        
        const headers = this.filteredData[0].headers;
        let csvContent = headers.join(',') + '\n';
        
        this.filteredData.forEach(item => {
            csvContent += item.data.map(cell => `"${cell || ''}"`).join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `bat_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
    
    handleResponsive() {
        const isMobile = window.innerWidth < this.options.mobileBreakpoint;
        const table = this.container.querySelector('.enhanced-table');
        
        if (table) {
            if (isMobile) {
                table.classList.add('mobile-optimized');
            } else {
                table.classList.remove('mobile-optimized');
            }
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Enhanced CSS for the table functionality
const enhancedTableCSS = `
<style>
.advanced-table-controls {
    background: var(--gray-50);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
    border: 1px solid var(--gray-200);
}

.search-wrapper {
    position: relative;
    max-width: 500px;
}

.search-input {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
    border-radius: var(--radius-md);
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-500);
    pointer-events: none;
}

.search-clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gray-500);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
}

.search-clear:hover {
    color: var(--bd-red);
    background: var(--gray-100);
}

.filter-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-md);
}

.quick-filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
}

.action-buttons {
    display: flex;
    gap: var(--space-sm);
}

/* Pagination Styles */
.pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 4px;
    border: 1px solid var(--border-color, #dee2e6);
}

.items-per-page {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.pagination-info {
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
    font-weight: 500;
}

.pagination-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.page-numbers {
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

.page-numbers .page-btn {
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color, #dee2e6);
    background: var(--bg-primary, white);
    color: var(--text-primary, #333);
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.page-numbers .page-btn:hover {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
}

.page-numbers .page-btn.active {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
    font-weight: 600;
}

.page-ellipsis {
    padding: 0 0.5rem;
    color: var(--text-muted, #6c757d);
}

.filter-btn {
    transition: all 0.2s ease;
}

.filter-btn.btn-primary {
    background: var(--bd-red);
    border-color: var(--bd-red);
    color: white;
}

.advanced-filters-panel {
    margin-top: var(--space-md);
}

.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
}

.filter-group .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--gray-700);
    margin-bottom: var(--space-sm);
}

.range-inputs {
    display: flex;
    gap: var(--space-sm);
}

.filter-actions {
    display: flex;
    gap: var(--space-sm);
}

.enhanced-table-wrapper {
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    background: white;
}

.table-container {
    overflow-x: auto;
}

.enhanced-table {
    margin-bottom: 0;
    font-size: 0.875rem;
}

.table-header {
    background: var(--gray-900);
    color: white;
}

.sortable-header {
    cursor: pointer;
    user-select: none;
    position: relative;
    padding-right: 2rem !important;
    transition: background-color 0.2s ease;
}

.sortable-header:hover {
    background: var(--gray-800) !important;
}

.sort-icon {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    opacity: 0.7;
}

.table-stats {
    padding: var(--space-md);
    border-top: 1px solid var(--gray-200);
    background: var(--gray-50);
    text-align: center;
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .advanced-table-controls {
        padding: var(--space-md);
    }
    
    .filter-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .quick-filters {
        justify-content: center;
        margin-bottom: var(--space-sm);
    }
    
    .action-buttons {
        justify-content: center;
    }
    
    /* Mobile pagination */
    .pagination-controls {
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
    }
    
    .pagination-buttons {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .page-numbers .page-btn {
        min-width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }
    
    .filter-grid {
        grid-template-columns: 1fr;
    }
    
    .enhanced-table {
        font-size: 0.75rem;
    }
    
    .enhanced-table th,
    .enhanced-table td {
        padding: var(--space-sm);
    }
    
    .search-input {
        font-size: 16px; /* Prevents zoom on iOS */
    }
}

@media (max-width: 576px) {
    .mobile-optimized th:nth-child(n+4),
    .mobile-optimized td:nth-child(n+4) {
        display: none;
    }
    
    .filter-actions {
        flex-direction: column;
    }
    
    /* Hide page numbers on very small screens, keep only prev/next */
    .page-numbers {
        display: none;
    }
    
    .pagination-buttons {
        justify-content: space-between;
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
    }
    
    .pagination-info {
        font-size: 0.8rem;
    }
    
    .items-per-page {
        font-size: 0.8rem;
    }
    
    /* Stack pagination elements on very small screens */
    .pagination-controls {
        gap: 0.5rem;
    }
}

/* Success states */
.filter-applied {
    border-color: var(--success) !important;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

/* Custom scrollbar for table */
.table-container::-webkit-scrollbar {
    height: 8px;
}

.table-container::-webkit-scrollbar-track {
    background: var(--gray-100);
    border-radius: var(--radius-sm);
}

.table-container::-webkit-scrollbar-thumb {
    background: var(--gray-400);
    border-radius: var(--radius-sm);
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: var(--gray-500);
}

/* Remove any spinning animations */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--gray-200);
    border-top: 2px solid var(--bd-red);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}
</style>
`;

// Auto-inject CSS
if (!document.querySelector('#advanced-table-css')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'advanced-table-css';
    styleSheet.innerHTML = enhancedTableCSS.replace('<style>', '').replace('</style>', '');
    document.head.appendChild(styleSheet);
}
