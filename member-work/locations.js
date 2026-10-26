/* group5.js - SHARED data for the Group 5 Safe Hand-off Locations Portal.
   Every member's script reads HUBS from here. Change it only after the group agrees.
   hours: { allDay: true } or { schedule: [{ days: [0-6], open: "HH:MM", close: "HH:MM" }] }   (0 = Sunday)
   lat, lng and the HOURS are estimates/placeholders until the group confirms them on campus. */

// // Folder that holds this file, so images load correctly wherever the page sits.
const G5_BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : '';
function g5Url(path) { return G5_BASE + path; }

const HUBS = [
    {
        id: 'hostel-a', name: 'Hostel A Reception Desk', shortName: 'Hostel A', badge: 'Hub 1',
        lat: 5.68893, lng: -0.20897,
        image: 'images/hostel-a.jpeg',
        location: 'Ground Floor Lobby, Main Entrance',
        details: 'Monitored front desk area equipped with CCTV cameras for safe student exchanges.',
        hours: { schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }] }
    },
    {
        id: 'hostel-b', name: 'Hostel B Reception Desk', shortName: 'Hostel B', badge: 'Hub 2',
        lat: 5.68908, lng: -0.20862,
        image: 'images/hostel-b.jpeg',
        location: 'Reception Counter, East Wings',
        details: 'Staffed reception desk providing secured temporary storage bins for hand-offs.',
        hours: { schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }] }
    },
    {
        id: 'library', name: 'University Library Circulation Desk', shortName: 'Library', badge: 'Hub 3',
        lat: 5.68877, lng: -0.20880,
        image: 'images/library.jpeg',
        location: 'Central Academic Block, Ground Level',
        details: 'Official library desk handling lost items and verified student hand-offs.',
        hours: { schedule: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '20:00' }] }
    },
    {
        id: 'security-post', name: 'South Gate Security Post', shortName: 'South Gate', badge: 'Hub 4',
        lat: 5.68810, lng: -0.20876,
        image: 'images/security-post.jpeg',
        location: 'South Campus Main Entrance',
        details: 'Primary safe spot recommended for high-value items or late-hour exchanges.',
        hours: { allDay: true }
    },
    {
        id: 'sca-office', name: 'SCA Office', shortName: 'SCA Office', badge: 'Hub 5',
        lat: 5.68880, lng: -0.20850,
        image: 'images/sca-office.jpeg',
        location: 'Student Center Building',
        details: 'Designated student service hub for verified hand-offs during administrative hours.',
        hours: { schedule: [{ days: [1, 2, 3, 4, 5], open: '08:30', close: '17:00' }] }
    },
    {
        id: 'west-gate', name: 'West Gate Security Post', shortName: 'West Gate', badge: 'Hub 6',
        lat: 5.68870, lng: -0.20920,
        image: 'images/west-gate-post.jpeg',
        location: 'West Campus Entrance',
        details: 'Secondary campus security checkpoint monitored round-the-clock for safe item pickups.',
        hours: { allDay: true }
    }
];
