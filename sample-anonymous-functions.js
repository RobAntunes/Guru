/**
 * Sample code with various anonymous function patterns
 * for testing Smart Symbol Naming
 */

// Variable assignment pattern
const validateUser = (user) => {
  return user && user.email && user.password;
};

// Object property pattern
const handlers = {
  save: function(data) {
    console.log('Saving:', data);
  },
  
  delete: (id) => {
    console.log('Deleting:', id);
  }
};

// Callback pattern
const users = ['alice', 'bob', 'charlie'];
const activeUsers = users.filter(user => user.length > 3);
const userEmails = users.map((user) => `${user}@example.com`);

// Export patterns
export default function() {
  return 'Hello world';
}

export const namedExport = () => {
  return 'Named export';
};

// Nested anonymous functions
function processData(data) {
  return data.map(item => {
    return item.properties.filter(prop => prop.active);
  });
}

// Class method pattern
class UserService {
  constructor() {
    this.users = [];
  }
  
  handleRequest = async (req) => {
    return this.processRequest(req);
  };
  
  processRequest(req) {
    return req.data;
  }
}

// Event handler pattern
document.addEventListener('click', function(event) {
  console.log('Clicked:', event.target);
});

// Immediately invoked function
(function() {
  console.log('IIFE executed');
})();

// Complex anonymous callback
setTimeout(() => {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      console.log('Data received:', data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}, 1000);
