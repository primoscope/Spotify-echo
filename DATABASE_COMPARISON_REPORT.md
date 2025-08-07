# Database Comparison and Audio Features Analysis Report

**Generated:** 2025-08-07T06:41:24.676Z
**Connection Status:** success
**Optimal Database:** echotune.spotify_analytics

## Executive Summary


**Recommended Database/Collection:** echotune.spotify_analytics
**Score:** 90.5/100
**Total Documents:** 43,303
**Audio Features Coverage:** 86.3%
**Missing Audio Features:** 5,945 tracks


## Database Analysis


### Database: echotune
**Size:** 397MB


#### Collection: echotune_chat_sessions
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 3



#### Collection: echotune_user_preferences
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 3



#### Collection: echotune_listening_history
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 6



#### Collection: echotune_users
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 5



#### Collection: echotune_playlists
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 4



#### Collection: echotune_recommendations
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 6



#### Collection: echotune_analytics_events
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 4



#### Collection: spotify_analytics
- **Documents:** 43,303
- **Average Document Size:** 2184 bytes
- **Storage Size:** 172MB
- **Indexes:** 17

- **Has Audio Features:** ✅
- **Has Listening Data:** ✅
- **Has Track Info:** ✅
- **Spotify URI Present:** ✅




### Database: spotify
**Size:** 0MB


#### Collection: echotune
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 1




### Database: spotify_analytics
**Size:** 209MB


#### Collection: chat_history
- **Documents:** 33
- **Average Document Size:** 449 bytes
- **Storage Size:** 0MB
- **Indexes:** 4

- **Has Audio Features:** ❌
- **Has Listening Data:** ❌
- **Has Track Info:** ❌
- **Spotify URI Present:** ❌



#### Collection: listening_history
- **Documents:** 203,090
- **Average Document Size:** 685 bytes
- **Storage Size:** 32MB
- **Indexes:** 24

- **Has Audio Features:** ❌
- **Has Listening Data:** ✅
- **Has Track Info:** ✅
- **Spotify URI Present:** ✅



#### Collection: user_profiles
- **Documents:** 9
- **Average Document Size:** 121 bytes
- **Storage Size:** 0MB
- **Indexes:** 4

- **Has Audio Features:** ❌
- **Has Listening Data:** ❌
- **Has Track Info:** ❌
- **Spotify URI Present:** ❌



#### Collection: playlists
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 4



#### Collection: recommendations
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 4



#### Collection: audio_features
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 6



#### Collection: track_metadata
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 6



#### Collection: auth_states
- **Documents:** 0
- **Average Document Size:** 0 bytes
- **Storage Size:** 0MB
- **Indexes:** 2



#### Collection: chat_sessions
- **Documents:** 18
- **Average Document Size:** 606 bytes
- **Storage Size:** 0MB
- **Indexes:** 1

- **Has Audio Features:** ❌
- **Has Listening Data:** ❌
- **Has Track Info:** ❌
- **Spotify URI Present:** ❌




## Audio Features Analysis


### echotune.spotify_analytics
- **Total Tracks:** 43,303
- **Complete Audio Features:** 37,358 (86.3%)
- **Partial Audio Features:** 43,303
- **With Track URIs:** 43,303
- **Missing Audio Features:** 5,945


### spotify_analytics.chat_history
- **Total Tracks:** 33
- **Complete Audio Features:** 0 (0.0%)
- **Partial Audio Features:** 0
- **With Track URIs:** 0
- **Missing Audio Features:** 33


### spotify_analytics.listening_history
- **Total Tracks:** 203,090
- **Complete Audio Features:** 18 (0.0%)
- **Partial Audio Features:** 18
- **With Track URIs:** 203,090
- **Missing Audio Features:** 203,072


### spotify_analytics.user_profiles
- **Total Tracks:** 9
- **Complete Audio Features:** 0 (0.0%)
- **Partial Audio Features:** 0
- **With Track URIs:** 0
- **Missing Audio Features:** 9


### spotify_analytics.chat_sessions
- **Total Tracks:** 18
- **Complete Audio Features:** 0 (0.0%)
- **Partial Audio Features:** 0
- **With Track URIs:** 0
- **Missing Audio Features:** 18


## Recommendations


1. **HIGH - audio_features**
   - **Issue:** 5945 tracks (13.7%) missing audio features
   - **Action:** Run audio features enhancement process to match remaining tracks with features data


2. **MEDIUM - data_completeness**
   - **Issue:** Another collection (spotify_analytics.listening_history) has more documents (203090 vs 43303)
   - **Action:** Consider merging data from multiple collections for maximum completeness


## Conclusion


The analysis recommends using **echotune.spotify_analytics** as the primary database/collection for the EchoTune AI project. This choice is based on:

- **Data Volume:** 43,303 tracks
- **Audio Features:** 86.3% coverage
- **Performance:** 17 indexes for query optimization
- **Data Quality:** Comprehensive track, artist, and listening information


**Action Required:** 5,945 tracks are missing audio features and should be processed to improve recommendation quality.



---
*Generated by Database Comparator for EchoTune AI*
