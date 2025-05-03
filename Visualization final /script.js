// Initialize variables
let storyMap;
let galleryMap;
let scroller;
let parksData;
let storyMarkers = [];
let galleryMarkers = [];
let currentSlide = 0;
let totalSlides = 0;

// Define US boundaries
const usBounds = [
    [-125.0, 24.0], // Southwest coordinates
    [-66.0, 49.5]   // Northeast coordinates
];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Mapbox
    mapboxgl.accessToken = 'pk.eyJ1IjoicGluZWFwcGxlZHVjayIsImEiOiJjbTl1aDVpNWowYTlkMmtwb3UzZnNncDdnIn0.j2rq84zWZc-XaRK7q49wqQ';
    
    // Initialize story map with outdoors style
    storyMap = new mapboxgl.Map({
        container: 'story-map',
        style: 'mapbox://styles/mapbox/outdoors-v11',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3,
        interactive: false, // Disable all interactions
        maxBounds: usBounds, // Restrict map panning to within these boundaries
        minZoom: 2 // Prevent zooming out too far
    });

    // Initialize gallery map with night/dark style
    galleryMap = new mapboxgl.Map({
        container: 'gallery-map',
        style: 'mapbox://styles/mapbox/navigation-night-v1', // Night theme
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3,
        interactive: false, // Disable all interactions
        maxBounds: usBounds,
        minZoom: 2
    });

    // Explicitly disable scroll zoom for both maps
    storyMap.scrollZoom.disable();
    galleryMap.scrollZoom.disable();
    
    // Disable other map controls for both maps
    storyMap.dragPan.disable();
    storyMap.doubleClickZoom.disable();
    storyMap.touchZoomRotate.disable();
    
    galleryMap.dragPan.disable();
    galleryMap.doubleClickZoom.disable();
    galleryMap.touchZoomRotate.disable();

    // Add Yellowstone boundary data once the story map is loaded
    storyMap.on('load', function() {
        // Add Yellowstone boundary source (approximate)
        storyMap.addSource('yellowstone-boundary', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[
                        [-111.1527, 44.1305],
                        [-111.1594, 45.0047],
                        [-109.9988, 45.0068],
                        [-110.0028, 44.1368],
                        [-111.1527, 44.1305]
                    ]]
                }
            }
        });
        
        // Add fill layer for Yellowstone highlight with 0 opacity initially
        storyMap.addLayer({
            'id': 'yellowstone-fill',
            'type': 'fill',
            'source': 'yellowstone-boundary',
            'paint': {
                'fill-color': '#FFD700',
                'fill-opacity': 0
            }
        });
        
        // Add outline layer for Yellowstone with 0 opacity initially
        storyMap.addLayer({
            'id': 'yellowstone-outline',
            'type': 'line',
            'source': 'yellowstone-boundary',
            'paint': {
                'line-color': '#FF5A5F',
                'line-width': 3,
                'line-opacity': 0
            }
        });
    });

    // Initialize gallery map
    galleryMap.on('load', function() {
        // Any additional setup for gallery map
    });

    // Load GeoJSON data
    loadParksData();

    // Set up Scrollama
    initScrollama();

    // Set up GSAP horizontal scroll for gallery
    initHorizontalScroll();

    // Initialize image carousel
    initCarousel();

    // Handle window resize
    window.addEventListener('resize', handleResize);
});

// Load National Parks GeoJSON data
async function loadParksData() {
    try {
        const response = await fetch('data/national_parks.geojson');
        parksData = await response.json();
        
        // Sort parks by year established
        parksData.features.sort((a, b) => a.properties.year - b.properties.year);
    } catch (error) {
        console.error('Error loading parks data:', error);
    }
}

// Initialize Scrollama
function initScrollama() {
    scroller = scrollama();

    scroller
        .setup({
            step: '.step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(handleStepEnter)
        .onStepExit(handleStepExit);
}

// Handle step enter events
function handleStepEnter(response) {
    const { element, index, direction } = response;
    const stepId = element.getAttribute('data-step');

    // Apply active class to current step
    element.classList.add('active');

    // Handle different steps
    switch (stepId) {
        case 'hayden':
            flyToYellowstone();
            // Don't show markers on the story map
            break;
        case 'yellowstone':
            flyToOldFaithful();
            // Show Yellowstone boundary highlight
            highlightYellowstone();
            break;
        case 'timeline':
            // We don't add markers to the story map anymore
            // Just show the boundary of Yellowstone
            resetStoryMapView();
            break;
        default:
            // Reset view for other steps
            resetStoryMapView();
            hideYellowstoneHighlight();
            break;
    }
}

// Handle step exit events
function handleStepExit(response) {
    const { element, index, direction } = response;
    
    // Remove active class
    element.classList.remove('active');
}

// Fly to Yellowstone (zoom level 6)
function flyToYellowstone() {
    storyMap.flyTo({
        center: [-110.5885, 44.4280],
        zoom: 6,
        essential: true,
        duration: 2000,
        maxBounds: usBounds
    });
    
    // Fade in the Yellowstone boundary outline
    if (storyMap.getLayer('yellowstone-outline')) {
        storyMap.setPaintProperty('yellowstone-outline', 'line-opacity', 0.8);
    }
}

// Fly to Old Faithful (zoom level 8)
function flyToOldFaithful() {
    storyMap.flyTo({
        center: [-110.828, 44.460],
        zoom: 8,
        essential: true,
        duration: 2000,
        maxBounds: usBounds
    });
}

// Reset story map view to continental US
function resetStoryMapView() {
    storyMap.flyTo({
        center: [-98.5795, 39.8283],
        zoom: 3,
        essential: true,
        duration: 2000
    });
    
    // Hide Yellowstone highlight
    hideYellowstoneHighlight();
}

// Highlight Yellowstone boundary
function highlightYellowstone() {
    if (storyMap.getLayer('yellowstone-fill') && storyMap.getLayer('yellowstone-outline')) {
        // Animate fill opacity with GSAP
        gsap.to({opacity: 0}, {
            opacity: 0.3,
            duration: 1,
            onUpdate: function() {
                storyMap.setPaintProperty('yellowstone-fill', 'fill-opacity', this.targets()[0].opacity);
            }
        });
        
        // Ensure outline is visible
        storyMap.setPaintProperty('yellowstone-outline', 'line-opacity', 0.8);
    }
}

// Hide Yellowstone highlight
function hideYellowstoneHighlight() {
    if (storyMap.getLayer('yellowstone-fill') && storyMap.getLayer('yellowstone-outline')) {
        storyMap.setPaintProperty('yellowstone-fill', 'fill-opacity', 0);
        storyMap.setPaintProperty('yellowstone-outline', 'line-opacity', 0);
    }
}

// Show parks in timeline sequence on story map - No longer used
function showParksTimeline() {
    // We're not showing markers on the story map anymore
    // This function is only kept for reference
}

// Add a marker for a park to the story map - No longer used
function addParkMarkerToStoryMap(park) {
    // We're not adding markers to the story map anymore
    // This function is only kept for reference
}

// Set up horizontal scroll gallery with GSAP ScrollTrigger
function initHorizontalScroll() {
    const parkInfo = document.getElementById('park-info');
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Create a horizontal scroll animation using ScrollTrigger
    const gallerySection = document.getElementById('horizontal-gallery');
    
    // Setup the ScrollTrigger for the entire section
    const galleryTrigger = ScrollTrigger.create({
        trigger: gallerySection,
        start: "top top",
        end: "+=8000", // Increase scroll duration to accommodate more parks
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onEnter: () => {
            // Display intro text when entering the section
            updateParkInfo({
                title: "Explore Parks Timeline",
                description: "Scroll to discover national parks in chronological order."
            });
            
            // Set a fixed view of the United States
            galleryMap.flyTo({
                center: [-115, 42], // Shifted center to include Alaska and Hawaii
                zoom: 2.5,         // Zoomed out to see all states including Alaska and Hawaii
                essential: true,
                duration: 1500
            });
            
            // Add all markers to gallery map with 0 opacity
            if (parksData) {
                clearGalleryMarkers();
                
                // Sort parks by year
                const sortedParks = [...parksData.features].sort((a, b) => 
                    a.properties.year - b.properties.year
                );
                
                // Store the sorted parks for reference when scrolling up
                window.sortedParks = sortedParks;
                
                // Setup timeline for sequential marker reveal
                const markerTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: gallerySection,
                        start: "top top",
                        end: "+=8000",
                        scrub: true,
                        onUpdate: self => {
                            // Calculate which park should be highlighted based on scroll progress
                            if (window.sortedParks && window.sortedParks.length > 0) {
                                const progress = self.progress;
                                // Skip intro portion (first 5%)
                                if (progress > 0.05) {
                                    const adjustedProgress = (progress - 0.05) / 0.85; // Normalize to 0-1 range in our active region
                                    const parkIndex = Math.min(
                                        Math.floor(adjustedProgress * window.sortedParks.length),
                                        window.sortedParks.length - 1
                                    );
                                    
                                    // Only update if the park index has changed
                                    if (window.currentParkIndex !== parkIndex) {
                                        window.currentParkIndex = parkIndex;
                                        const park = window.sortedParks[parkIndex];
                                        
                                        // Update info and highlight current marker
                                        updateParkInfo({
                                            title: `${park.properties.name} (${park.properties.year})`,
                                            description: park.properties.description
                                        });
                                        
                                        // Reset all markers and highlight just the current one
                                        galleryMarkers.forEach((marker, i) => {
                                            const el = marker.getElement();
                                            el.classList.remove('highlight');
                                            if (i === parkIndex) {
                                                el.classList.add('highlight');
                                            }
                                        });
                                    }
                                } else {
                                    // Show intro text when at the beginning
                                    updateParkInfo({
                                        title: "Explore Parks Timeline",
                                        description: "Scroll to discover national parks in chronological order."
                                    });
                                }
                            }
                        }
                    }
                });
                
                // Add each park marker with animation
                sortedParks.forEach((park, index) => {
                    // Create marker with 0 opacity
                    const marker = addParkMarkerToGalleryMap(park, 0);
                    
                    // Calculate when this marker should appear (evenly spaced)
                    const progress = index / (sortedParks.length - 1);
                    const startPos = 0.05 + (progress * 0.85); // From 5% to 90% of scroll
                    
                    // Add to timeline
                    markerTimeline.to(marker.getElement(), {
                        opacity: 1,
                        scale: 1.2,
                        duration: 0.1
                    }, startPos);
                    
                    // Then reduce scale slightly
                    markerTimeline.to(marker.getElement(), {
                        scale: 1,
                        duration: 0.05,
                        onComplete: () => {
                            // Ensure marker stays visible
                            marker.getElement().style.opacity = 1;
                        }
                    }, startPos + 0.01);
                });
            }
        },
        onLeave: () => {
            // Hide park info when leaving section
            hideParkInfo();
        },
        onEnterBack: () => {
            // Show park info again when scrolling back up into section
            updateParkInfo({
                title: "Explore Parks Timeline",
                description: "Scroll to discover national parks in chronological order."
            });
        },
        onLeaveBack: () => {
            // Hide park info when scrolling back before the section
            hideParkInfo();
        }
    });
}

// Add a marker for a park to the gallery map with specified opacity
function addParkMarkerToGalleryMap(park, initialOpacity = 1) {
    const coordinates = park.geometry.coordinates;
    const properties = park.properties;

    // Fix for Acadia coordinates if needed
    let fixedCoordinates = [...coordinates];
    if (properties.name === "Acadia") {
        // More accurate coordinates for Acadia National Park (centered on Mount Desert Island)
        fixedCoordinates = [-68.2558, 44.3385];
    }

    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker';
    if (properties.highlight) {
        el.classList.add('highlight');
    }
    
    // Set initial opacity if provided
    if (initialOpacity !== 1) {
        el.style.opacity = initialOpacity;
    }

    // Create popup with park info
    const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3>${properties.name} (${properties.year})</h3>
                 <p>${properties.description}</p>`);

    // Create and add the marker - use center anchor for round dots
    const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
    })
        .setLngLat(fixedCoordinates)
        .setPopup(popup)
        .addTo(galleryMap);

    // Store marker reference
    galleryMarkers.push(marker);
    
    return marker;
}

// Update park info overlay
function updateParkInfo(data) {
    const parkInfo = document.getElementById('park-info');
    if (!parkInfo) return;
    
    // Update content
    parkInfo.innerHTML = `
        <h3>${data.title}</h3>
        <p>${data.description}</p>
    `;
    
    // Make visible
    parkInfo.classList.add('active');
}

// Hide park info overlay
function hideParkInfo() {
    const parkInfo = document.getElementById('park-info');
    if (!parkInfo) return;
    
    parkInfo.classList.remove('active');
}

// Clear all markers from the story map
function clearStoryMarkers() {
    // Clear any existing markers if they exist
    storyMarkers.forEach(marker => marker.remove());
    storyMarkers = [];
}

// Clear all markers from the gallery map
function clearGalleryMarkers() {
    galleryMarkers.forEach(marker => marker.remove());
    galleryMarkers = [];
}

// Handle window resize
function handleResize() {
    if (scroller) {
        scroller.resize();
    }
    
    // Update ScrollTrigger
    ScrollTrigger.refresh();
}

// Helper function to check if point is within US bounds
function isWithinUSBounds(point) {
    return point.lng >= usBounds[0][0] && 
           point.lng <= usBounds[1][0] && 
           point.lat >= usBounds[0][1] && 
           point.lat <= usBounds[1][1];
}

// Helper function to constrain a point to US bounds
function constrainToUSBounds(point) {
    const constrainedLng = Math.max(usBounds[0][0], Math.min(usBounds[1][0], point.lng));
    const constrainedLat = Math.max(usBounds[0][1], Math.min(usBounds[1][1], point.lat));
    
    return {
        lng: constrainedLng,
        lat: constrainedLat
    };
}

// Initialize image carousel
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const dotsContainer = document.querySelector('.carousel-dots');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    totalSlides = carouselItems.length;
    
    // Create dots
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.setAttribute('data-index', i);
        dotsContainer.appendChild(dot);
        
        // Add click event to dots
        dot.addEventListener('click', () => {
            goToSlide(i);
        });
    }
    
    // Set first slide as active
    goToSlide(0);
    
    // Add event listeners to buttons
    prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });
    
    nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
    });
    
    // Optional: Auto-advance slides
    const autoAdvance = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000);
    
    // Pause auto-advance when user interacts with carousel
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoAdvance);
    });
}

// Go to a specific slide
function goToSlide(index) {
    const carouselItems = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.dot');
    
    // Handle wraparound
    if (index < 0) {
        index = totalSlides - 1;
    } else if (index >= totalSlides) {
        index = 0;
    }
    
    // Update current slide index
    currentSlide = index;
    
    // Remove active class from all slides and dots
    carouselItems.forEach(item => {
        item.classList.remove('active');
    });
    
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    // Add active class to current slide and dot
    carouselItems[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

