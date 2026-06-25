# Matching Algorithm

The MVP uses a rule-based matching engine. No AI image recognition is planned for MVP.

Initial scoring rules planned for Phase 2:

- Species match: +30
- Color match: +20
- Collar match: +15
- Distance within 1 kilometer: +20
- Sighting within 7 days of last seen: +15
- Similar pattern or normalized keywords: +10

Scores are clamped to 0-100 and grouped into LOW, MEDIUM, and HIGH levels.
