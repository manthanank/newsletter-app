document.addEventListener('DOMContentLoaded', () => {
    // Set up dynamic base URL for API calls
    const apiBaseUrl = window.location.origin;
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            link.classList.add('active');
            const targetSection = document.getElementById(link.dataset.section);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // If switching away from templates section, reset editing state
            if (link.dataset.section !== 'templates' && isEditingTemplate) {
                resetTemplateForm();
            }
        });
    });

    // Add template editing state variables
    let currentTemplateId = null;
    let isEditingTemplate = false;
    let currentNewsletterId = null;
    let isEditingNewsletter = false;
    
    // Hide cancel button on load
    document.getElementById('cancel-template-btn').style.display = 'none';

    // Load all data when page loads
    loadSubscribers();
    loadGroups();
    loadTemplates();
    loadScheduledNewsletters();

    // === SUBSCRIBERS SECTION ===

    // Search subscribers functionality
    document.getElementById('subscriber-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterSubscribers(searchTerm, document.getElementById('group-filter').value);
    });

    // Filter subscribers by group
    document.getElementById('group-filter').addEventListener('change', (e) => {
        const selectedGroup = e.target.value;
        filterSubscribers(document.getElementById('subscriber-search').value.toLowerCase(), selectedGroup);
    });

    // === TEMPLATES SECTION ===
    
    // Save template functionality
    document.getElementById('template-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const templateName = document.getElementById('template-name').value;
        const templateSubject = document.getElementById('template-subject').value;
        const templateContent = document.getElementById('template-content').value;
        
        if (templateName && templateSubject && templateContent) {
            if (isEditingTemplate && currentTemplateId) {
                // Update existing template
                updateTemplate(currentTemplateId, templateName, templateSubject, templateContent);
            } else {
                // Create new template
                saveTemplate(templateName, templateSubject, templateContent);
            }
        }
    });

    // Cancel template edit functionality
    document.getElementById('cancel-template-btn').addEventListener('click', () => {
        // Clear form
        document.getElementById('template-name').value = '';
        document.getElementById('template-subject').value = '';
        document.getElementById('template-content').value = '';
        
        // Reset editing state
        currentTemplateId = null;
        isEditingTemplate = false;
        
        // Reset button text and hide cancel button
        document.getElementById('save-template-btn').textContent = 'Save Template';
        document.getElementById('cancel-template-btn').style.display = 'none';
    });

    // Load template when selected in newsletter section
    document.getElementById('newsletter-template').addEventListener('change', (e) => {
        const templateId = e.target.value;
        if (templateId) {
            fetch(`${apiBaseUrl}/api/templates/${templateId}`)
                .then(response => response.json())
                .then(template => {
                    document.getElementById('newsletter-subject').value = template.subject;
                    document.getElementById('newsletter-content').value = template.content;
                })
                .catch(error => console.error('Error loading template:', error));
        }
    });

    // === SCHEDULED NEWSLETTERS SECTION ===
    
    // Schedule newsletter functionality
    document.getElementById('schedule-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('newsletter-name').value;
        const subject = document.getElementById('newsletter-subject').value;
        const content = document.getElementById('newsletter-content').value;
        const scheduledDate = document.getElementById('newsletter-date').value;
        
        // Get selected groups
        const targetGroups = Array.from(
            document.querySelectorAll('#newsletter-groups-checkboxes input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        
        if (name && subject && content && scheduledDate) {
            if (isEditingNewsletter && currentNewsletterId) {
                // Update existing newsletter
                updateScheduledNewsletter(currentNewsletterId, name, subject, content, scheduledDate, targetGroups);
            } else {
                // Create new newsletter
                scheduleNewsletter(name, subject, content, scheduledDate, targetGroups);
            }
        }
    });

    // Fetch data functions
    function loadSubscribers() {
        fetch(`${apiBaseUrl}/api/subscribers`)
            .then(response => response.json())
            .then(subscribers => {
                displaySubscribers(subscribers);
            })
            .catch(error => console.error('Error loading subscribers:', error));
    }

    function loadGroups() {
        fetch(`${apiBaseUrl}/api/subscribers/groups`)
            .then(response => response.json())
            .then(groups => {
                displayGroups(groups);
            })
            .catch(error => console.error('Error loading groups:', error));
    }

    function loadTemplates() {
        fetch(`${apiBaseUrl}/api/templates`)
            .then(response => response.json())
            .then(templates => {
                displayTemplates(templates);
                populateTemplateDropdown(templates);
            })
            .catch(error => console.error('Error loading templates:', error));
    }

    function loadScheduledNewsletters() {
        fetch(`${apiBaseUrl}/api/scheduled-newsletters`)
            .then(response => response.json())
            .then(newsletters => {
                displayScheduledNewsletters(newsletters);
            })
            .catch(error => console.error('Error loading scheduled newsletters:', error));
    }

    // Display data functions
    function displaySubscribers(subscribers) {
        const tbody = document.getElementById('subscribers-list');
        tbody.innerHTML = '';
        
        if (subscribers.length === 0) {
            // Display empty state message
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="5" class="empty-message">
                    <div class="empty-state">
                        <i class="empty-icon">📭</i>
                        <h3>No subscribers yet</h3>
                        <p>When users subscribe to your newsletter, they will appear here.</p>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
            return;
        }
        
        subscribers.forEach(subscriber => {
            const tr = document.createElement('tr');
            
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            };
            
            tr.innerHTML = `
                <td>${subscriber.email}</td>
                <td>${subscriber.name || '—'}</td>
                <td>${subscriber.groups ? subscriber.groups.join(', ') : '—'}</td>
                <td>${formatDate(subscriber.subscriptionDate)}</td>
                <td>
                    <button class="delete-btn" data-email="${subscriber.email}">Delete</button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const email = e.target.dataset.email;
                if (confirm(`Are you sure you want to delete ${email}?`)) {
                    deleteSubscriber(email);
                }
            });
        });
    }

    function displayGroups(groups) {
        const groupsList = document.getElementById('groups-list');
        groupsList.innerHTML = '';
        
        const groupFilter = document.getElementById('group-filter');
        // Clear existing options except the first one
        Array.from(groupFilter.options).slice(1).forEach(option => option.remove());
        
        const newsletterGroups = document.getElementById('newsletter-groups-checkboxes');
        newsletterGroups.innerHTML = '';
        
        if (groups.length === 0) {
            // Display empty state message for groups
            groupsList.innerHTML = `
                <li class="empty-message">
                    <div class="empty-state">
                        <i class="empty-icon">🏷️</i>
                        <h3>No groups created</h3>
                        <p>Create your first group to categorize subscribers.</p>
                    </div>
                </li>
            `;
            return;
        }
        
        groups.forEach(group => {
            // Add to groups list
            const li = document.createElement('li');
            li.textContent = group;
            groupsList.appendChild(li);
            
            // Add to filter dropdown
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupFilter.appendChild(option);
            
            // Add to newsletter group checkboxes
            const checkboxItem = document.createElement('div');
            checkboxItem.className = 'checkbox-item';
            checkboxItem.innerHTML = `
                <input type="checkbox" id="group-${group}" value="${group}">
                <label for="group-${group}">${group}</label>
            `;
            newsletterGroups.appendChild(checkboxItem);
        });
    }

    function displayTemplates(templates) {
        const templatesList = document.getElementById('templates-list');
        templatesList.innerHTML = '';
        
        if (templates.length === 0) {
            // Display empty state message for templates
            templatesList.innerHTML = `
                <div class="empty-state">
                    <i class="empty-icon">📝</i>
                    <h3>No templates yet</h3>
                    <p>Create your first template to start sending beautiful newsletters.</p>
                </div>
            `;
            return;
        }
        
        templates.forEach(template => {
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card';
            templateCard.innerHTML = `
                <h4>${template.name}</h4>
                <p><strong>Subject:</strong> ${template.subject}</p>
                <div class="template-preview">${template.content.substring(0, 100)}${template.content.length > 100 ? '...' : ''}</div>
                <div class="template-actions">
                    <button class="edit-template-btn" data-id="${template._id}">Edit</button>
                    <button class="delete-template-btn" data-id="${template._id}">Delete</button>
                </div>
            `;
            
            templatesList.appendChild(templateCard);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-template-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateId = e.target.dataset.id;
                editTemplate(templateId);
            });
        });
        
        document.querySelectorAll('.delete-template-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const templateId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this template?')) {
                    deleteTemplate(templateId);
                }
            });
        });
    }

    function populateTemplateDropdown(templates) {
        const templateSelect = document.getElementById('newsletter-template');
        // Clear existing options except the first one
        Array.from(templateSelect.options).slice(1).forEach(option => option.remove());
        
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template._id;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });
    }

    function displayScheduledNewsletters(newsletters) {
        const tbody = document.getElementById('scheduled-list');
        tbody.innerHTML = '';
        
        if (newsletters.length === 0) {
            // Display empty state message
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="5" class="empty-message">
                    <div class="empty-state">
                        <i class="empty-icon">📅</i>
                        <h3>No scheduled newsletters</h3>
                        <p>Schedule your first newsletter to start sending content to your subscribers.</p>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
            return;
        }
        
        newsletters.forEach(newsletter => {
            const tr = document.createElement('tr');
            
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            };
            
            const statusClass = `status-${newsletter.status}`;
            
            tr.innerHTML = `
                <td>${newsletter.name}</td>
                <td>${newsletter.subject}</td>
                <td>${formatDate(newsletter.scheduledDate)}</td>
                <td><span class="status-badge ${statusClass}">${newsletter.status}</span></td>
                <td>
                    ${newsletter.status === 'scheduled' ? 
                        `<button class="send-now-btn" data-id="${newsletter._id}">Send Now</button>
                        <button class="edit-newsletter-btn" data-id="${newsletter._id}">Edit</button>` : 
                        `<button class="view-analytics-btn" data-id="${newsletter._id}">Analytics</button>`
                    }
                    <button class="delete-newsletter-btn" data-id="${newsletter._id}">Delete</button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.send-now-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const newsletterId = e.target.dataset.id;
                if (confirm('Are you sure you want to send this newsletter now?')) {
                    sendNewsletterNow(newsletterId);
                }
            });
        });
        
        document.querySelectorAll('.edit-newsletter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const newsletterId = e.target.dataset.id;
                editScheduledNewsletter(newsletterId);
            });
        });
        
        document.querySelectorAll('.view-analytics-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const newsletterId = e.target.dataset.id;
                viewNewsletterAnalytics(newsletterId);
            });
        });
        
        document.querySelectorAll('.delete-newsletter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const newsletterId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this newsletter?')) {
                    deleteScheduledNewsletter(newsletterId);
                }
            });
        });
    }

    // Filter functions
    function filterSubscribers(searchTerm, groupFilter) {
        const subscribers = document.querySelectorAll('#subscribers-list tr');
        
        subscribers.forEach(row => {
            const email = row.cells[0].textContent.toLowerCase();
            const name = row.cells[1].textContent.toLowerCase();
            const groups = row.cells[2].textContent.toLowerCase();
            
            const matchesSearch = email.includes(searchTerm) || name.includes(searchTerm);
            const matchesGroup = !groupFilter || groups.includes(groupFilter.toLowerCase());
            
            row.style.display = matchesSearch && matchesGroup ? '' : 'none';
        });
    }

    // CRUD operations
    // Reset template form helper function
    function resetTemplateForm() {
        // Clear form fields
        document.getElementById('template-name').value = '';
        document.getElementById('template-subject').value = '';
        document.getElementById('template-content').value = '';
        
        // Reset editing state
        currentTemplateId = null;
        isEditingTemplate = false;
        
        // Reset button text and hide cancel button
        document.getElementById('save-template-btn').textContent = 'Save Template';
        document.getElementById('cancel-template-btn').style.display = 'none';
    }

    async function deleteSubscriber(email) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            
            if (response.ok) {
                loadSubscribers(); // Refresh the list
            } else {
                console.error('Failed to delete subscriber');
            }
        } catch (error) {
            console.error('Error deleting subscriber:', error);
        }
    }

    async function saveTemplate(name, subject, content) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, subject, content }),
            });
            
            if (response.ok) {
                // Clear form
                document.getElementById('template-name').value = '';
                document.getElementById('template-subject').value = '';
                document.getElementById('template-content').value = '';
                
                // Refresh templates
                loadTemplates();
                
                alert('Template saved successfully!');
            } else {
                console.error('Failed to save template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
        }
    }

    // Updated editTemplate function - removed unnecessary debugging logs
    async function editTemplate(templateId) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/templates/${templateId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
            }
            
            const template = await response.json();
            
            // Fill the form with template data
            document.getElementById('template-name').value = template.name;
            document.getElementById('template-subject').value = template.subject;
            document.getElementById('template-content').value = template.content;
            
            // Set editing state
            currentTemplateId = templateId;
            isEditingTemplate = true;
            
            // Change button text to indicate editing
            document.getElementById('save-template-btn').textContent = 'Update Template';
            
            // Show cancel button
            document.getElementById('cancel-template-btn').style.display = 'inline-block';
            
            // Switch to templates tab
            document.querySelector('[data-section="templates"]').click();
        } catch (error) {
            console.error('Error loading template for edit:', error);
            alert(`Error loading template: ${error.message}`);
        }
    }

    async function updateTemplate(templateId, name, subject, content) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, subject, content }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to update template: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
            }
            
            // Clear form and reset editing state
            document.getElementById('template-name').value = '';
            document.getElementById('template-subject').value = '';
            document.getElementById('template-content').value = '';
            currentTemplateId = null;
            isEditingTemplate = false;
            
            // Reset button text and hide cancel button
            document.getElementById('save-template-btn').textContent = 'Save Template';
            document.getElementById('cancel-template-btn').style.display = 'none';
            
            // Refresh templates
            loadTemplates();
            
            alert('Template updated successfully!');
        } catch (error) {
            console.error('Error updating template:', error);
            alert(`Error updating template: ${error.message}`);
        }
    }

    async function deleteTemplate(templateId) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/templates/${templateId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                loadTemplates(); // Refresh the list
            } else {
                console.error('Failed to delete template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    }

    async function scheduleNewsletter(name, subject, content, scheduledDate, targetGroups) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/scheduled-newsletters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name, 
                    subject, 
                    content, 
                    scheduledDate, 
                    targetGroups 
                }),
            });
            
            if (response.ok) {
                // Clear form
                document.getElementById('newsletter-name').value = '';
                document.getElementById('newsletter-subject').value = '';
                document.getElementById('newsletter-content').value = '';
                document.getElementById('newsletter-date').value = '';
                document.getElementById('newsletter-template').selectedIndex = 0;
                
                // Uncheck all group checkboxes
                document.querySelectorAll('#newsletter-groups-checkboxes input[type="checkbox"]')
                    .forEach(cb => cb.checked = false);
                
                // Refresh scheduled newsletters
                loadScheduledNewsletters();
                
                alert('Newsletter scheduled successfully!');
            } else {
                console.error('Failed to schedule newsletter');
            }
        } catch (error) {
            console.error('Error scheduling newsletter:', error);
        }
    }

    // Similarly enhance the newsletter editing function
    async function editScheduledNewsletter(newsletterId) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/scheduled-newsletters/${newsletterId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch newsletter: ${response.status} ${response.statusText}`);
            }
            
            const newsletter = await response.json();
            
            // Fill the form with newsletter data
            document.getElementById('newsletter-name').value = newsletter.name;
            document.getElementById('newsletter-subject').value = newsletter.subject;
            document.getElementById('newsletter-content').value = newsletter.content;
            
            // Format the date for datetime-local input
            const scheduledDate = new Date(newsletter.scheduledDate);
            const formattedDate = scheduledDate.toISOString().slice(0, 16);
            document.getElementById('newsletter-date').value = formattedDate;
            
            // Check the appropriate group checkboxes
            document.querySelectorAll('#newsletter-groups-checkboxes input[type="checkbox"]')
                .forEach(cb => {
                    cb.checked = newsletter.targetGroups && newsletter.targetGroups.includes(cb.value);
                });
            
            // Set editing state
            currentNewsletterId = newsletterId;
            isEditingNewsletter = true;
            
            // Change button text to indicate editing
            document.getElementById('schedule-newsletter-btn').textContent = 'Update Newsletter';
            
            // Switch to scheduled newsletters tab
            document.querySelector('[data-section="scheduled"]').click();
        } catch (error) {
            console.error('Error loading newsletter for edit:', error);
            alert(`Error loading newsletter: ${error.message}`);
        }
    }
    
    async function updateScheduledNewsletter(newsletterId, name, subject, content, scheduledDate, targetGroups) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/scheduled-newsletters/${newsletterId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name, 
                    subject, 
                    content, 
                    scheduledDate, 
                    targetGroups 
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to update newsletter: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
            }
            
            // Clear form and reset editing state
            document.getElementById('newsletter-name').value = '';
            document.getElementById('newsletter-subject').value = '';
            document.getElementById('newsletter-content').value = '';
            document.getElementById('newsletter-date').value = '';
            document.getElementById('newsletter-template').selectedIndex = 0;
            currentNewsletterId = null;
            isEditingNewsletter = false;
            
            // Reset button text
            document.getElementById('schedule-newsletter-btn').textContent = 'Schedule Newsletter';
            
            // Uncheck all group checkboxes
            document.querySelectorAll('#newsletter-groups-checkboxes input[type="checkbox"]')
                .forEach(cb => cb.checked = false);
            
            // Refresh scheduled newsletters
            loadScheduledNewsletters();
            
            alert('Newsletter updated successfully!');
        } catch (error) {
            console.error('Error updating newsletter:', error);
            alert(`Error updating newsletter: ${error.message}`);
        }
    }

    async function sendNewsletterNow(newsletterId) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/scheduled-newsletters/${newsletterId}/send`, {
                method: 'POST',
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(`Newsletter sent to ${result.newsletter.analytics.sent} subscribers!`);
                loadScheduledNewsletters(); // Refresh the list
            } else {
                console.error('Failed to send newsletter');
            }
        } catch (error) {
            console.error('Error sending newsletter:', error);
        }
    }

    async function deleteScheduledNewsletter(newsletterId) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/scheduled-newsletters/${newsletterId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                loadScheduledNewsletters(); // Refresh the list
            } else {
                console.error('Failed to delete scheduled newsletter');
            }
        } catch (error) {
            console.error('Error deleting scheduled newsletter:', error);
        }
    }

    function viewNewsletterAnalytics(newsletterId) {
        fetch(`${apiBaseUrl}/api/scheduled-newsletters/${newsletterId}`)
            .then(response => response.json())
            .then(newsletter => {
                // Calculate percentages
                const { sent, opened, clicked } = newsletter.analytics;
                const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
                const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
                
                alert(`
                    Newsletter Analytics:
                    - Sent: ${sent} emails
                    - Opened: ${opened} (${openRate}% open rate)
                    - Clicked: ${clicked} (${clickRate}% click-through rate)
                `);
            })
            .catch(error => console.error('Error loading analytics:', error));
    }
});