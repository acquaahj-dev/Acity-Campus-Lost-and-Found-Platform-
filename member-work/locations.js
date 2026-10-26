/* group5.js - SHARED data for the Group 5 Safe Hand-off Locations Portal.
   Every member's script reads HUBS from here. Change it only after the group agrees.
   hours: { allDay: true } or { schedule: [{ days: [0-6], open: "HH:MM", close: "HH:MM" }] }   (0 = Sunday)
   Hostel A, Hostel B, Library and SCA coordinates were provided for these hubs.
   The listed hours still need campus confirmation. */

// // Folder that holds this file, so images load correctly wherever the page sits.
const G5_BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : '';
function g5Url(path) { return G5_BASE + path; }

const HUBS = [
    {
        id: 'hostel-a', name: 'Hostel A Reception Desk', shortName: 'Hostel A', badge: 'Hub 1',
        lat: 5.689454, lng: -0.208549,
        image: '../images/Hostel A front-desk.jpg',
        location: 'Ground Floor Lobby, Main Entrance',
        details: 'Monitored front desk area equipped with CCTV cameras for safe student exchanges.',
        hours: { schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }] }
    },
    {
        id: 'hostel-b', name: 'Hostel B Reception Desk', shortName: 'Hostel B', badge: 'Hub 2',
        lat: 5.689394, lng: -0.208254,
        image: '../images/Hostel B front desk.jpg',
        location: 'Reception Counter, East Wings',
        details: 'Staffed reception desk providing secured temporary storage bins for hand-offs.',
        hours: { schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }] }
    },
    {
        id: 'library', name: 'University Library Circulation Desk', shortName: 'Library', badge: 'Hub 3',
        lat: 5.688967, lng: -0.210017,
        image: '../images/Library.jpg',
        location: 'Central Academic Block, Ground Level',
        details: 'Official library desk handling lost items and verified student hand-offs.',
        hours: { schedule: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '20:00' }] }
    },
    {
        id: 'security-post', name: 'South Gate Security Post', shortName: 'South Gate', badge: 'Hub 4',
        lat: 5.690130, lng: -0.209530,
        image: '../images/South gate Security post.jpg',
        location: 'South Campus Main Entrance',
        details: 'Primary safe spot recommended for high-value items or late-hour exchanges.',
        hours: { allDay: true }
    },
    {
        id: 'sca-office', name: 'SCA Office', shortName: 'SCA Office', badge: 'Hub 5',
        lat: 5.689440, lng: -0.209737,
        image: '../images/SCA- office.jpg',
        location: 'Student Center Building',
        details: 'Designated student service hub for verified hand-offs during administrative hours.',
        hours: { schedule: [{ days: [1, 2, 3, 4, 5], open: '08:30', close: '17:00' }] }
    },
    {
        id: 'west-gate', name: 'West Gate Security Post', shortName: 'West Gate', badge: 'Hub 6',
        lat: 5.689150, lng: -0.208952,
        image: '../images/West gate security post.jpg',
        location: 'West Campus Entrance',
        details: 'Secondary campus security checkpoint monitored round-the-clock for safe item pickups.',
        hours: { allDay: true }
    }
];
