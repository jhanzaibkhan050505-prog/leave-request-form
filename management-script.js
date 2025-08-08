document.addEventListener('DOMContentLoaded', function () {
    // !!! IMPORTANT: Paste your Google Apps Script URL here again.
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyON7WC-RpY0dnhSuT5_c2xfE056MCqYHRSjbtfY75qXFq0oA0zKwcq_NE6ZpSpRdHJ3w/exec';

    const tableContainer = document.getElementById('requests-table-container');
    const loadingMessage = document.getElementById('loading-message');
    let allRequests = []; // To store all fetched requests

    // --- Modal Logic ---
    const modal = document.getElementById('declineModal');
    const closeButton = document.querySelector('.close-button');
    const confirmDeclineBtn = document.getElementById('confirmDecline');
    const managerNotesTextarea = document.getElementById('managerNotes');
    let rowIdToDecline = null;

    closeButton.onclick = () => { modal.style.display = "none"; };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
    confirmDeclineBtn.onclick = () => {
        if (rowIdToDecline) {
            updateStatus(rowIdToDecline, 'Declined', managerNotesTextarea.value);
            modal.style.display = "none";
        }
    };

    // --- Main Functions ---

    // Fetches all leave requests from the Google Sheet
    function fetchRequests() {
        fetch(scriptURL)
            .then(response => response.json())
            .then(data => {
                loadingMessage.style.display = 'none';
                allRequests = data;
                filterRequests('Pending'); // Show pending requests by default
            })
            .catch(error => {
                console.error('Error fetching requests:', error);
                loadingMessage.textContent = 'Failed to load requests.';
            });
    }

    // Filters and displays requests based on status
    window.filterRequests = function(status) {
        const filteredData = allRequests.filter(req => req.status === status);
        renderTable(filteredData, status);
        
        // Update active tab button style
        document.querySelectorAll('.tab-link').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`.tab-link[onclick="filterRequests('${status}')"]`).classList.add('active');
    };

    // Renders the data into an HTML table
    function renderTable(data, status) {
        if (data.length === 0) {
            tableContainer.innerHTML = `<p>No ${status.toLowerCase()} requests found.</p>`;
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Team</th>
                        <th>Leave Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        ${status === 'Pending' ? '<th>Actions</th>' : '<th>Manager Notes</th>'}
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(req => {
            const startDate = new Date(req.startDate).toLocaleDateString();
            const endDate = new Date(req.endDate).toLocaleDateString();
            tableHTML += `
                <tr>
                    <td>${req.employeeName} (${req.employeeID})</td>
                    <td>${req.team}</td>
                    <td>${req.leaveType}</td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td>${req.reason}</td>
                    ${status === 'Pending' ? `
                    <td class="actions-cell">
                        <button class="approve-btn" onclick="updateStatus(${req.rowId}, 'Approved')">Approve</button>
                        <button class="decline-btn" onclick="openDeclineModal(${req.rowId})">Decline</button>
                    </td>` : `<td>${req.managerNotes || ''}</td>`}
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        tableContainer.innerHTML = tableHTML;
    }

    // Opens the decline reason modal
    window.openDeclineModal = function(rowId) {
        rowIdToDecline = rowId;
        managerNotesTextarea.value = '';
        modal.style.display = 'flex';
    };
    
    // Calls the Google Apps Script to update the status of a request
    window.updateStatus = function(rowId, newStatus, notes = '') {
        loadingMessage.style.display = 'block';
        loadingMessage.textContent = 'Updating...';

        // We need to call our script in a special way to run a specific function
        const updateUrl = `${scriptURL}?action=update`;
        const requestData = {
            rowId: rowId,
            status: newStatus,
            notes: notes
        };
        
        // This is a workaround because GAS doesn't directly support custom function routing in GET/POST.
        // We'll tell the script what to do in the body of a POST request.
        fetch(updateUrl, {
            method: 'POST',
            body: JSON.stringify({
                functionName: 'updateRequestStatus',
                parameters: [requestData]
            }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then(result => {
             console.log(result);
             fetchRequests(); // Refresh the data table
        })
        .catch(error => {
            console.error('Error updating status:', error);
            loadingMessage.textContent = 'Update failed.';
        });
    }
    
    // We need to modify our doPost function in GAS to handle this routing
    // Let's go back and update GAS code to handle this routing logic
});

// A small adjustment to Code.gs to handle function routing
// The doPost function should be updated to check for an action parameter
function doPost_updated(e) {
  var requestData = JSON.parse(e.postData.contents);
  
  if (requestData.functionName) {
    // This is a call to a specific function
    var result = this[requestData.functionName].apply(null, requestData.parameters);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } else {
    // This is the original form submission
    //... (The original doPost code for saving a new request goes here)
  }
}

// Initial fetch of data when the page loads
fetchRequests();