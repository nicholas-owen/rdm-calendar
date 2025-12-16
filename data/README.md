# Research Data Management Calendar

Welcome to the RDM Calendar, a curated list of conferences and events relevant to the Research Data Management (RDM) community.

## Purpose

This application helps Data Stewards, Research Software Engineers (RSEs), Data Scientists, and other research technology professionals stay informed about upcoming meetings, plenaries, and conferences within their domain. It serves as a central hub to track events that matter to you.

## Features

*   **Curated Timeline**: Visualize upcoming events in chronological order with key details like dates, location, and description.
*   **Profession Filters**: Use the sidebar to filter events based on your role (e.g., toggle "RSE" or "Data Steward" to see only relevant gatherings).
*   **iCal Integration**: Click the "Download iCal" button to generate a customized calendar file (`.ics`) that includes only your currently filtered events.
*   **Themes**: Customize your viewing experience with Light, Dark, and Modern themes accessible via the Settings menu.
*   **Event Submission**: Easily propose new events by clicking the "+" icon in the sidebar. This opens a form to submit details, which are automatically converted into a GitHub Issue for review and addition to the calendar.

## Contributing

The underlying data for this calendar is managed through simple YAML files located in the `data/` directory. You can contribute in two ways:

1.  **Via Interface**: Click the "+" icon in the sidebar to propose an event. This will automatically create a formatted GitHub Issue for review.
2.  **Via Pull Request**: Directly add valid YAML files to the `data/` directory.

Each file represents a conference and includes metadata such as:
-   Conference Name and Link
-   Target Professions
-   Event Dates and Details

Please view the `example.yaml` file for a template.

CC BY-SA 4.0
[Nicholas Owen](https://nicholas-owen.github.io/) 2025.
