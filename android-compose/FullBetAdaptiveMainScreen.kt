package com.fullbet.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

// =========================================================================
// KOULÈ TÈM FULL BET & GAIN CASH HAÏTI
// =========================================================================
private val DarkBackground = Color(0xFF0D1322)
private val CardBackground = Color(0xFF151D30)
private val CardHoverBackground = Color(0xFF1A253D)
private val AccentBlue = Color(0xFF1E88E5)
private val CyanGlow = Color(0xFF00E5FF)
private val TextWhite = Color(0xFFFFFFFF)
private val TextGray = Color(0xFF94A3B8)
private val GreenWin = Color(0xFF4CAF50)
private val RedNotification = Color(0xFFE53935)
private val OrangeLive = Color(0xFFE53935)
private val GoldYellow = Color(0xFFFFB300)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FullBetAdaptiveMainScreen(
    onOpenDrawer: () -> Unit = {},
    onOpenCart: () -> Unit = {},
    onOpenNotifications: () -> Unit = {},
    showNotificationButton: Boolean = false,
    onSelectModule: (String) -> Unit = {},
    onSelectOdd: (match: String, oddType: String, oddValue: String) -> Unit = { _, _, _ -> }
) {
    val scrollState = rememberScrollState()
    var selectedModule by remember { mutableStateOf("Paris Sportifs") }
    var selectedFilter by remember { mutableStateOf("Tous") }
    var selectedSport by remember { mutableStateOf("Tous") }
    var isMasked by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            // Tèt aplikasyon an ak echèl fleksib (Anti-overflow)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkBackground)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Seksyon Meni + Logo avèk weight(1f)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 6.dp)
                ) {
                    IconButton(
                        onClick = onOpenDrawer,
                        modifier = Modifier
                            .size(38.dp)
                            .background(CardBackground, shape = RoundedCornerShape(8.dp))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Menu,
                            contentDescription = "Meni",
                            tint = TextWhite
                        )
                    }

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 4.dp)
                    ) {
                        Text(
                            text = "FULL BET",
                            color = TextWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp, // Gwo Tit (20.sp a 24.sp)
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "PARIS SPORTIFS • GAIN CASH",
                            color = AccentBlue,
                            fontSize = 10.sp, // Trè Ti Tèks / Captions (10.sp)
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Seksyon Bouton Aksyon (Solde, Tikè, Notifikasyon)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Solde ak masquage opsyonèl
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = CardBackground,
                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.5f)),
                        modifier = Modifier.clickable { isMasked = !isMasked }
                    ) {
                        Text(
                            text = if (isMasked) "•••• HTG" else "12 500 HTG",
                            color = GreenWin,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Bouton Tikè / Panier
                    IconButton(
                        onClick = onOpenCart,
                        modifier = Modifier
                            .size(36.dp)
                            .background(CardBackground, shape = RoundedCornerShape(8.dp))
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = "🎫", fontSize = 14.sp)
                        }
                    }

                    // Bouton Notifikasyon ak pwent wouj (opsyonèl)
                    if (showNotificationButton) {
                        Box(modifier = Modifier.size(36.dp)) {
                            IconButton(
                                onClick = onOpenNotifications,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(CardBackground, shape = RoundedCornerShape(8.dp))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Notifications,
                                    contentDescription = "Notifikasyon",
                                    tint = TextWhite,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(RedNotification, shape = CircleShape)
                                    .align(Alignment.TopEnd)
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        // Kontni ki ka fè defile (Scrollable) pou anpeche tout debòdman
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(DarkBackground)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Onglet de kategori (Paris Sportifs, Casino, Borlette)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TabButton(
                    title = "⚽ Paris Sportifs",
                    isSelected = selectedModule == "Paris Sportifs",
                    modifier = Modifier.weight(1f)
                ) {
                    selectedModule = "Paris Sportifs"
                    onSelectModule("Paris Sportifs")
                }

                TabButton(
                    title = "🎰 Casino",
                    isSelected = selectedModule == "Casino",
                    modifier = Modifier.weight(1f)
                ) {
                    selectedModule = "Casino"
                    onSelectModule("Casino")
                }

                TabButton(
                    title = "🎟️ Borlette",
                    isSelected = selectedModule == "Borlette",
                    modifier = Modifier.weight(1f)
                ) {
                    selectedModule = "Borlette"
                    onSelectModule("Borlette")
                }
            }

            // 2. Kat Bannière "Boost de cotes"
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = CardBackground,
                border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "BOOST DE COTES +30% • LIGUE DES CHAMPIONS",
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Offre gérée en direct par Full Bet. Cotes boostées & dépôts instantanés MonCash / NatCash.",
                        color = TextGray,
                        fontSize = 11.sp,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Button(
                        onClick = { /* Aksyon wè dirèk */ },
                        colors = ButtonDefaults.buttonColors(containerColor = CyanGlow),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "⚡ Voir le direct",
                            color = DarkBackground,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            // 3. Filtè segondè (Tous, En Direct, À Venir) - Sèvi ak Row fleksib weight(1f)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChipCustom(
                    title = "Tous (8)",
                    isSelected = selectedFilter == "Tous",
                    modifier = Modifier.weight(1f)
                ) {
                    selectedFilter = "Tous"
                }

                FilterChipCustom(
                    title = "🔴 EN DIRECT (4)",
                    isSelected = selectedFilter == "En Direct",
                    modifier = Modifier.weight(1f)
                ) {
                    selectedFilter = "En Direct"
                }

                FilterChipCustom(
                    title = "À Venir",
                    isSelected = selectedFilter == "À Venir",
                    modifier = Modifier.weight(1f)
                ) {
                    selectedFilter = "À Venir"
                }
            }

            // 4. Filtè sport yo (Horizontally scrollable pou evite debòde)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SportPill(icon = "🏆", title = "Tous (8)", isSelected = selectedSport == "Tous") { selectedSport = "Tous" }
                SportPill(icon = "⚽", title = "Football (6)", isSelected = selectedSport == "Football") { selectedSport = "Football" }
                SportPill(icon = "🏀", title = "Basketball (2)", isSelected = selectedSport == "Basketball") { selectedSport = "Basketball" }
                SportPill(icon = "🎾", title = "Tennis", isSelected = selectedSport == "Tennis") { selectedSport = "Tennis" }
                SportPill(icon = "🥊", title = "Boxe / MMA", isSelected = selectedSport == "Boxe") { selectedSport = "Boxe" }
            }

            // 5. Tit seksyon match
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PARIS SPORTIFS (8)",
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "Cotes en direct • Clic pour coupon",
                    color = TextGray,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // 6. Kat Match 1 (Real Madrid vs Manchester City)
            MatchCardItem(
                league = "Ligue des Champions",
                region = "Europe",
                isLive = true,
                liveTime = "🔴 68'",
                homeTeam = "Real Madrid",
                homeScore = "2",
                awayTeam = "Manchester City",
                awayScore = "1",
                oddHome = "2.15",
                oddDraw = "3.40",
                oddAway = "3.20",
                homeLabel = "REA",
                drawLabel = "NUL",
                awayLabel = "MAN",
                onSelectOdd = onSelectOdd
            )

            // 7. Kat Match 2 (Arsenal vs Chelsea FC)
            MatchCardItem(
                league = "Premier League",
                region = "Angleterre",
                isLive = false,
                liveTime = "20:00",
                homeTeam = "Arsenal FC",
                homeScore = null,
                awayTeam = "Chelsea FC",
                awayScore = null,
                oddHome = "1.80",
                oddDraw = "3.75",
                oddAway = "4.20",
                homeLabel = "ARS",
                drawLabel = "NUL",
                awayLabel = "CHE",
                onSelectOdd = onSelectOdd
            )

            // 8. Kat Match 3 (FC Barcelona vs Atlético de Madrid)
            MatchCardItem(
                league = "La Liga",
                region = "Espagne",
                isLive = false,
                liveTime = "Demain 21:00",
                homeTeam = "FC Barcelona",
                homeScore = null,
                awayTeam = "Atlético Madrid",
                awayScore = null,
                oddHome = "1.95",
                oddDraw = "3.50",
                oddAway = "3.90",
                homeLabel = "BAR",
                drawLabel = "NUL",
                awayLabel = "ATM",
                onSelectOdd = onSelectOdd
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

// =========================================================================
// COMPOSANTS REUTILISABLES ANTI-OVERFLOW
// =========================================================================

@Composable
fun TabButton(
    title: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) AccentBlue else CardBackground,
        border = BorderStroke(1.dp, if (isSelected) AccentBlue else AccentBlue.copy(alpha = 0.2f)),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 4.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = title,
                color = TextWhite,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun FilterChipCustom(
    title: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = if (isSelected) AccentBlue.copy(alpha = 0.25f) else CardBackground,
        border = BorderStroke(1.dp, if (isSelected) AccentBlue else AccentBlue.copy(alpha = 0.15f)),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = title,
                color = if (isSelected) CyanGlow else TextGray,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun SportPill(
    icon: String,
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        color = if (isSelected) AccentBlue else CardBackground,
        border = BorderStroke(1.dp, if (isSelected) AccentBlue else TextGray.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(text = icon, fontSize = 12.sp)
            Text(
                text = title,
                color = TextWhite,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun OddButton(
    label: String,
    odd: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = DarkBackground,
        border = BorderStroke(0.8.dp, AccentBlue.copy(alpha = 0.3f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label,
                color = TextGray,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = odd,
                color = CyanGlow,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun MatchCardItem(
    league: String,
    region: String,
    isLive: Boolean,
    liveTime: String,
    homeTeam: String,
    homeScore: String?,
    awayTeam: String,
    awayScore: String?,
    oddHome: String,
    oddDraw: String,
    oddAway: String,
    homeLabel: String,
    drawLabel: String,
    awayLabel: String,
    onSelectOdd: (match: String, oddType: String, oddValue: String) -> Unit
) {
    val matchName = "$homeTeam vs $awayTeam"

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = CardBackground,
        border = BorderStroke(0.8.dp, AccentBlue.copy(alpha = 0.25f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Header Match info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f).padding(end = 4.dp)
                ) {
                    Text(
                        text = league,
                        color = AccentBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = AccentBlue
                    ) {
                        Text(
                            text = "NOUVEAU",
                            color = TextWhite,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "• $region", color = TextGray, fontSize = 11.sp)
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (isLive) OrangeLive else AccentBlue.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = liveTime,
                            color = TextWhite,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            // Équipes ak Nòt avèk weight(1f) pou evite tout debòdman
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = homeTeam,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp, // Tit pou Modèl yo / Card Titles (14.sp)
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f).padding(end = 8.dp)
                    )
                    Text(
                        text = homeScore ?: "-",
                        color = CyanGlow,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = awayTeam,
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp, // Tit pou Modèl yo / Card Titles (14.sp)
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f).padding(end = 8.dp)
                    )
                    Text(
                        text = awayScore ?: "-",
                        color = CyanGlow,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }

            Text(
                text = "RÉSULTAT DU MATCH (1X2)",
                color = TextGray,
                fontSize = 10.sp, // Trè Ti Tèks / Captions (10.sp)
                fontWeight = FontWeight.Bold
            )

            // Bouton Cotes 1X2 (Sèvi ak weight pou pataje espas egalman san debòde)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                OddButton(
                    label = homeLabel,
                    odd = oddHome,
                    modifier = Modifier.weight(1f),
                    onClick = { onSelectOdd(matchName, homeLabel, oddHome) }
                )
                OddButton(
                    label = drawLabel,
                    odd = oddDraw,
                    modifier = Modifier.weight(1f),
                    onClick = { onSelectOdd(matchName, drawLabel, oddDraw) }
                )
                OddButton(
                    label = awayLabel,
                    odd = oddAway,
                    modifier = Modifier.weight(1f),
                    onClick = { onSelectOdd(matchName, awayLabel, oddAway) }
                )
            }

            // Seksyon Mache konplemantè
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "⚙️ Marchés complémentaires",
                    color = TextGray,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = AccentBlue.copy(alpha = 0.3f)
                ) {
                    Text(
                        text = "+3",
                        color = CyanGlow,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
        }
    }
}
