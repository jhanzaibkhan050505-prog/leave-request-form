document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('leaveRequestForm');
    const durationRadios = document.querySelectorAll('input[name="duration"]');
    const specificDateGroup = document.getElementById('specific-date-group');
    const dateRangeGroup = document.getElementById('date-range-group');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const submitButton = document.getElementById('submitButton');

    // Function to toggle date inputs based on radio button selection
    const toggleDateInputs = () => {
        const selectedDuration = document.querySelector('input[name="duration"]:checked').value;
        if (selectedDuration === 'specific') {
            specificDateGroup.style.display = 'block';
            dateRangeGroup.style.display = 'none';
        } else {
            specificDateGroup.style.display = 'none';
            dateRangeGroup.style.display = 'block';
        }
    };

    // Add event listeners to radio buttons
    durationRadios.forEach(radio => {
        radio.addEventListener('change', toggleDateInputs);
    });

    // Handle form submission
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Basic validation
        const team = document.getElementById('team').value;
        const employeeName = document.getElementById('employeeName').value;
        const employeeId = document.getElementById('employeeId').value;
        const leaveType = document.getElementById('leaveType').value;

        if (!team || !employeeName || !employeeId || !leaveType) {
            alert('Please fill out all required fields.');
            return;
        }

        // Prepare data for submission
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        const scriptURL = 'https://script.google.com/macros/s/AKfycbyON7WC-RpY0dnhSuT5_c2xfE056MCqYHRSjbtfY75qXFq0oA0zKwcq_NE6ZpSpRdHJ3w/exec';

        // Disable button to prevent multiple submissions
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        // Send data to Google Apps Script
        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                confirmationMessage.style.display = 'block';
                form.reset();
                toggleDateInputs(); // Reset to default view
            } else {
                throw new Error('Network response was not ok.');
            }
        })
        .catch(error => {
            console.error('Error!', error.message);
            alert('There was an error submitting your request. Please try again.');
        })
        .finally(() => {
            // Re-enable the button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
        });
    });

    // Initial call to set the correct date input visibility
    toggleDateInputs();
});