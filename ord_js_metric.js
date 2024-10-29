const mainMetrics = htmlNode.querySelectorAll('.main-metrics li');

// Function to extract all query parameters from the current URL
const getAllParamsFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const paramsObject = {};

  // Only include parameters that start with 'var-'
  params.forEach((value, key) => {
    if (key.startsWith('var-')) {
      if (paramsObject[key]) {
        if (!Array.isArray(paramsObject[key])) {
          paramsObject[key] = [paramsObject[key]]; // Convert existing value to an array
        }
        paramsObject[key].push(value); // Add new value to the array
      } else {
        paramsObject[key] = value; // Store the parameter value
      }
    }
  });
  
  return paramsObject;
};

async function fetchMetricsData() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/Swaroop696/Metric/refs/heads/main/metrics.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null; // Handle error by returning null
  }
}

const updateSubmetrics = (key, parentElement, metricsData) => {
  const submetrics = metricsData[key];
  const submetricsList = parentElement.querySelector('.submetrics');
  const allParams = getAllParamsFromUrl(); // Get relevant parameters from the URL

  if (submetricsList && submetrics) {
    submetricsList.innerHTML = ''; // Clear existing submetrics

    submetrics.forEach(submetric => {
      const listItem = document.createElement('li');
      listItem.textContent = submetric.name;

      // Add URL redirection if URL exists
      if (submetric.url) {
        listItem.classList.add('clickable-metric');

        // Create a new URL object to modify the existing URL
        const url = new URL(submetric.url);
        
        // Append all relevant parameters to the new URL
        Object.entries(allParams).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(val => {
              url.searchParams.append(key, val); // Append each value for the key
            });
          } else {
            url.searchParams.set(key, value);
          }
        });

        // Set the modified URL with parameters
        listItem.setAttribute('data-url', url.toString());
      }

      submetricsList.appendChild(listItem);
    });

    // Handle redirection for clickable metrics
    const clickableMetrics = submetricsList.querySelectorAll('.clickable-metric');
    clickableMetrics.forEach(metric => {
      metric.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        if (url) {
          // Re-fetch parameters to ensure the latest values are used
          const updatedParams = getAllParamsFromUrl();
          const updatedUrl = new URL(url); // Create a new URL object

          // Clear existing params and re-append updated ones
          updatedUrl.searchParams.forEach((_, key) => updatedUrl.searchParams.delete(key));
          Object.entries(updatedParams).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(val => updatedUrl.searchParams.append(key, val));
            } else {
              updatedUrl.searchParams.set(key, value);
            }
          });

          window.location.href = updatedUrl.toString(); // Redirect to the updated URL
        }
      });
    });

    // Show submetrics with animation
    setTimeout(() => {
      submetricsList.classList.add('show');
    }, 100);
  } else {
    console.error("Submetrics element or data not found!");
  }
};

// Attach event listeners to each main metric
mainMetrics.forEach(metric => {
  metric.addEventListener('click', async () => {
    const currentMetric = metric.dataset.submetrics;
    const currentSubmetrics = metric.querySelector('.submetrics');

    // Toggle the current submetrics
    if (currentSubmetrics.classList.contains('show')) {
      currentSubmetrics.classList.remove('show');
      metric.querySelector('.toggle-sign').textContent = '+';
    } else {
      // Fetch metrics data
      const metricsData = await fetchMetricsData();
      if (metricsData) {
        updateSubmetrics(currentMetric, metric, metricsData);
        currentSubmetrics.classList.add('show');
        metric.querySelector('.toggle-sign').textContent = '-';
      }
    }

    // Close other submetrics
    mainMetrics.forEach(otherMetric => {
      if (otherMetric !== metric) {
        otherMetric.querySelector('.submetrics').classList.remove('show');
        otherMetric.querySelector('.toggle-sign').textContent = '+';
      }
    });
  });
});

// Initialize with default metric
(async () => {
  const metricsData = await fetchMetricsData();
  if (metricsData) {
    const defaultMetric = htmlNode.querySelector('[data-submetrics="user-engagement"]');
    if (defaultMetric) {
      updateSubmetrics('user-engagement', defaultMetric, metricsData);
      defaultMetric.classList.add('active');
      const toggleSign = defaultMetric.querySelector('.toggle-sign');
      if (toggleSign) {
        toggleSign.textContent = '-';
      }
    }
  }
})();
