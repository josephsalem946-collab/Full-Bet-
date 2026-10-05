package com.fullbet.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

// =========================================================================
// KOULÈ AK TÈM OFISYÈL FULL BET / GAIN CASH
// =========================================================================
val DarkBackground = Color(0xFF0D1322)
val CardBackground = Color(0xFF151D30)
val CardHoverBackground = Color(0xFF1A253D)
val AccentBlue = Color(0xFF1E88E5)
val AccentCyan = Color(0xFF00E5FF)
val TextWhite = Color(0xFFFFFFFF)
val TextGray = Color(0xFF94A3B8)
val GreenWin = Color(0xFF4CAF50)
val RedNotification = Color(0xFFE53935)
val GoldYellow = Color(0xFFFFB300)

// Modèl Done pou Match & Jwèt
data class SportMatchItem(
    val id: String,
    val league: String,
    val homeTeam: String,
    val awayTeam: String,
    val homeScore: String? = null,
    val awayScore: String? = null,
    val isLive: Boolean = false,
    val timeOrMinute: String,
    val oddHome: String,
    val oddDraw: String,
    val oddAway: String
)

data class TopGameItem(
    val id: Int,
    val emoji: String,
    val title: String,
    val category: String,
    val description: String,
    val badge: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FullBetCompleteAppScreen(
    onNavigateToWallet: (action: String) -> Unit = {},
    onNavigateToGame: (gameId: String) -> Unit = {},
    onNavigateToNotifications: () -> Unit = {}
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    // Eta Navigasyon ak Entèfas
    var selectedModule by remember { mutableStateOf("Paris Sportifs") }
    var borletteSubSection by remember { mutableStateOf("Pran Fich") }
    var isMasked by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategoryFilter by remember { mutableStateOf("Tout") }
    var unreadNotifsCount by remember { mutableIntStateOf(3) }

    // Lis Match Egzanp
    val sampleMatches = remember {
        listOf(
            SportMatchItem("m1", "UEFA Champions League", "Real Madrid", "Manchester City", "2", "1", true, "67'", "2.10", "3.40", "3.25"),
            SportMatchItem("m2", "Premier League", "Arsenal", "Chelsea FC", null, null, false, "20:00", "1.75", "3.80", "4.60"),
            SportMatchItem("m3", "La Liga", "FC Barcelona", "Atlético de Madrid", null, null, false, "Demain", "1.95", "3.50", "3.90"),
            SportMatchItem("m4", "Ligue 1", "Paris Saint-Germain", "Olympique de Marseille", "1", "0", true, "34'", "1.50", "4.20", "5.80")
        )
    }

    // Lis Top 15 Jwèt Casino & Arcade
    val top15Games = remember {
        listOf(
            TopGameItem(1, "⚡", "Gates of Olympus", "Machine à Sous", "Multiplikatè zèklè jiska 500x", "Popilè"),
            TopGameItem(2, "✈️", "Aviator Crash", "Jeu Crash", "Kite avyon an monte anvan li kraze", "Hot"),
            TopGameItem(3, "🎡", "Lightning Roulette", "Casino en Direct", "Nimewo chans ak miltiplikatè 50x-500x", "Live"),
            TopGameItem(4, "🍬", "Sweet Bonanza", "Machine à Sous", "Kaskad fwi ak bonbon sirèt", "Bonus"),
            TopGameItem(5, "🎲", "Crazy Time", "Live Show", "Wou fòtin jeyan ak 4 bonis entèaktif", "Live"),
            TopGameItem(6, "🎱", "Lucky Six 6/48", "Arcade Exclusif", "Tiraj boul rapid chak 3 minit", "Eksklizif")
        )
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = DarkBackground,
                // RÈGLE ANTI-OVERFLOW: Pas de largeur rigide, conteneur adaptatif
                modifier = Modifier
                    .fillMaxHeight()
                    .widthIn(max = 340.dp)
                    .fillMaxWidth(0.85f)
            ) {
                // =========================================================================
                // TIROIR LATÉRAL (DRAWER) AVEC SCROLL VERTICAL ANTI-DÉBORDEMENT
                // =========================================================================
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    // 1. TÈT MENI AN (HEADER)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Tit principal avec weight(1f) pou pa janm pouse bouton fèmen an deyò
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .padding(end = 8.dp)
                        ) {
                            Text(
                                text = "FULL BET",
                                color = TextWhite,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "PARIS • CASINO • BORLETTE",
                                color = AccentBlue,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        // Bouton Notifikasyon & Bouton Fèmen
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Notifikasyon ak Badge Wouj
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(CardBackground)
                                    .border(BorderStroke(1.dp, AccentBlue.copy(alpha = 0.3f)), RoundedCornerShape(8.dp))
                                    .clickable {
                                        scope.launch { drawerState.close() }
                                        onNavigateToNotifications()
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Notifications,
                                    contentDescription = "Notifikasyon",
                                    tint = TextWhite,
                                    modifier = Modifier.size(18.dp)
                                )
                                if (unreadNotifsCount > 0) {
                                    Box(
                                        modifier = Modifier
                                            .size(14.dp)
                                            .align(Alignment.TopEnd)
                                            .offset(x = 2.dp, y = (-2).dp)
                                            .clip(CircleShape)
                                            .background(RedNotification),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "$unreadNotifsCount",
                                            color = TextWhite,
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            // Bouton Fèmen
                            IconButton(
                                onClick = { scope.launch { drawerState.close() } },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Text(text = "✕", color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2. KAT PWOFIL ITILIZATÈ (MASKE / DÉMASKE)
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = CardBackground,
                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.3f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            // Liy 1: Avatar + Non + Telefòn + Toggle Masquage
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = AccentBlue,
                                    modifier = Modifier.size(38.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(text = "JB", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                                Spacer(modifier = Modifier.width(10.dp))

                                // Kolòn tèks ak Modifier.weight(1f) pou evite debòdman
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(end = 6.dp)
                                ) {
                                    Text(
                                        text = if (isMasked) "Jean-Baptiste P••••" else "Jean-Baptiste Pierre-Louis",
                                        color = TextWhite,
                                        fontSize = 14.sp, // Tit pou Modèl yo / Card Titles (14.sp)
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(3.dp),
                                            color = Color(0xFF2E7D32)
                                        ) {
                                            Text(
                                                text = "18+",
                                                color = TextWhite,
                                                fontSize = 10.sp, // Trè Ti Tèks / Captions (10.sp)
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                            )
                                        }
                                        Text(
                                            text = if (isMasked) "+509 •••• ••••" else "+509 3215 3281",
                                            color = TextGray,
                                            fontSize = 11.sp, // Ti Detay / Subtitles (11.sp)
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                // Bouton je pou maske / démaske
                                IconButton(
                                    onClick = { isMasked = !isMasked },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Text(
                                        text = if (isMasked) "👁️" else "🔒",
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Divider(color = AccentBlue.copy(alpha = 0.15f), thickness = 0.8.dp)
                            Spacer(modifier = Modifier.height(10.dp))

                            // Liy 2: Solde ak Bouton Aksyon Dépôt & Retrè
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(end = 8.dp)
                                ) {
                                    Text(
                                        text = "SOLDE DISPONIB",
                                        color = TextGray,
                                        fontSize = 10.sp, // Trè Ti Tèks / Captions (10.sp)
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = if (isMasked) "•••••• HTG" else "12,500 HTG",
                                        color = GreenWin,
                                        fontSize = 14.sp, // Tit pou Modèl yo / Card Titles (14.sp)
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Button(
                                        onClick = {
                                            scope.launch { drawerState.close() }
                                            onNavigateToWallet("deposit")
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = GreenWin),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text(text = "Dépôt", color = TextWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            scope.launch { drawerState.close() }
                                            onNavigateToWallet("withdraw")
                                        },
                                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.5f)),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text(text = "Retrè", color = AccentBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3. SEKSYON MODIL PRINCIPAL YO
                    Text(
                        text = "MODIL PRINCIPAL YO",
                        color = TextGray,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
                    )

                    val modules = listOf(
                        Triple("Paris Sportifs", "⚽", "Cotes Direct & Pre-match"),
                        Triple("Casino & Crash", "🎰", "Aviator, Roulette & Slots"),
                        Triple("La Borlette Haïtienne", "🎟️", "Tirages NY & Florida")
                    )

                    modules.forEach { (name, icon, subtitle) ->
                        val isSelected = selectedModule == name
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) AccentBlue.copy(alpha = 0.2f) else CardBackground,
                            border = BorderStroke(1.dp, if (isSelected) AccentBlue else Color.Transparent),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp)
                                .clickable { selectedModule = name }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = icon, fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(end = 6.dp)
                                ) {
                                    Text(
                                        text = name,
                                        color = if (isSelected) TextWhite else TextGray,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = subtitle,
                                        color = TextGray.copy(alpha = 0.8f),
                                        fontSize = 10.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Text(
                                    text = if (isSelected) "●" else "›",
                                    color = if (isSelected) AccentBlue else TextGray,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }

                    // Sous-seksyon Borlette si li chwazi
                    if (selectedModule == "La Borlette Haïtienne") {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = 20.dp, top = 4.dp, bottom = 6.dp)
                        ) {
                            val borletteTabs = listOf(
                                "Pran Fich (Bolet, Maryaj)",
                                "Tirages New York & Florida",
                                "Fich Mwen Yo (Historique)",
                                "Rezilta & Estatistik"
                            )
                            borletteTabs.forEach { tab ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(6.dp))
                                        .clickable { borletteSubSection = tab }
                                        .padding(vertical = 6.dp, horizontal = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(text = "•", color = AccentBlue, fontSize = 12.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = tab,
                                        color = if (borletteSubSection == tab) TextWhite else TextGray,
                                        fontSize = 11.sp,
                                        fontWeight = if (borletteSubSection == tab) FontWeight.Bold else FontWeight.Normal,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 4. TOP 15 JWÈT CASINO & ARCADE DIRECTS
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "TOP JWÈT DIRECTS",
                            color = TextGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            text = "Gade tout ↗",
                            color = AccentBlue,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // RÈGLE ANTI-OVERFLOW: horizontalScroll sou filtè yo
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(bottom = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("Tout", "Machine à Sous", "Crash", "Live Casino", "Arcade").forEach { cat ->
                            val isCatActive = selectedCategoryFilter == cat
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = if (isCatActive) AccentBlue else CardBackground,
                                border = BorderStroke(1.dp, if (isCatActive) AccentBlue else AccentBlue.copy(alpha = 0.2f)),
                                modifier = Modifier.clickable { selectedCategoryFilter = cat }
                            ) {
                                Text(
                                    text = cat,
                                    color = if (isCatActive) TextWhite else TextGray,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Lis kat jwèt yo
                    top15Games.forEach { game ->
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = CardBackground,
                            border = BorderStroke(0.8.dp, AccentBlue.copy(alpha = 0.25f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp)
                                .clickable {
                                    scope.launch { drawerState.close() }
                                    onNavigateToGame(game.title)
                                }
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(text = game.emoji, fontSize = 16.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "${game.id}. ${game.title}",
                                        color = TextWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = AccentBlue.copy(alpha = 0.2f)
                                    ) {
                                        Text(
                                            text = game.category,
                                            color = AccentBlue,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = game.description,
                                    color = TextGray,
                                    fontSize = 10.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = game.badge,
                                        color = GreenWin,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Text(
                                        text = "Jwe Kounye a →",
                                        color = AccentBlue,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    ) {
        // =========================================================================
        // EKRAN PRINCIPAL (MAIN SCREEN BODY)
        // =========================================================================
        Scaffold(
            containerColor = DarkBackground,
            topBar = {
                // Top App Bar responsive
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CardBackground)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { scope.launch { drawerState.open() } },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Menu,
                            contentDescription = "Meni",
                            tint = TextWhite
                        )
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    // Tit avèk Modifier.weight(1f) pou evite debòdman
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 4.dp)
                    ) {
                        Text(
                            text = "FULL BET",
                            color = TextWhite,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "GAIN CASH HAÏTI",
                            color = AccentCyan,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Bouton Solde rapid
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFF0D1322),
                        border = BorderStroke(1.dp, GreenWin.copy(alpha = 0.4f)),
                        modifier = Modifier.clickable { onNavigateToWallet("overview") }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isMasked) "•••• HTG" else "12,500 HTG",
                                color = GreenWin,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            },
            bottomBar = {
                // Bottom Navigation Bar
                Surface(
                    color = CardBackground,
                    border = BorderStroke(0.5.dp, AccentBlue.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        listOf(
                            Triple("Sport", "⚽", selectedModule == "Paris Sportifs"),
                            Triple("Casino", "🎰", selectedModule == "Casino & Crash"),
                            Triple("Borlette", "🎟️", selectedModule == "La Borlette Haïtienne"),
                            Triple("Pòtfe", "💳", false)
                        ).forEach { (label, emoji, active) ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .clickable {
                                        when (label) {
                                            "Sport" -> selectedModule = "Paris Sportifs"
                                            "Casino" -> selectedModule = "Casino & Crash"
                                            "Borlette" -> selectedModule = "La Borlette Haïtienne"
                                            "Pòtfe" -> onNavigateToWallet("overview")
                                        }
                                    }
                                    .padding(horizontal = 8.dp)
                            ) {
                                Text(text = emoji, fontSize = 16.sp)
                                Text(
                                    text = label,
                                    color = if (active) AccentCyan else TextGray,
                                    fontSize = 10.sp,
                                    fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        ) { paddingValues ->
            // RÈGLE ANTI-OVERFLOW: LazyColumn ou verticalScroll pou tout ekran an
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 12.dp)
            ) {
                // 1. BANNIÈRE AK FILTRE ESPÒ YO (SCROLL HORIZONTAL)
                item {
                    Spacer(modifier = Modifier.height(10.dp))

                    // RÈGLE ANTI-OVERFLOW: horizontalScroll sou lis kategori espò yo
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(
                            Pair("Tout Espò", "🏆"),
                            Pair("Foutbòl", "⚽"),
                            Pair("Baskètbòl", "🏀"),
                            Pair("Tenis", "🎾"),
                            Pair("Bòks", "🥊"),
                            Pair("E-Sports", "🎮")
                        ).forEach { (sportName, icon) ->
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = CardBackground,
                                border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.3f)),
                                modifier = Modifier.clickable { /* Filtre sport */ }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(text = icon, fontSize = 13.sp)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = sportName,
                                        color = TextWhite,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                }

                // 2. TIT SEKSYON MATCH EN DIRECT
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .weight(1f)
                                .padding(end = 8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(RedNotification)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "MATCH EN DIRECT & PRE-MATCH",
                                color = TextWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Text(
                            text = "Filtre ⚙️",
                            color = AccentBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                }

                // 3. LIS MATCH YO AVÈK KOREKSYON RÈD OVERFLOW SOU KLÈB AK KÒT YO
                items(sampleMatches) { match ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = CardBackground,
                        border = BorderStroke(0.8.dp, AccentBlue.copy(alpha = 0.25f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 5.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            // Liy 1: Lig + Tan match
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = match.league,
                                    color = TextGray,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )

                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = if (match.isLive) RedNotification.copy(alpha = 0.2f) else AccentBlue.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = match.timeOrMinute,
                                        color = if (match.isLive) RedNotification else AccentCyan,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            // Liy 2: Ekip Lokal ak Vizitè avèk weight(1f) sou chak non ekip
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Ekip 1
                                Text(
                                    text = match.homeTeam,
                                    color = TextWhite,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )

                                // Skor oswa VS nan mitan
                                Text(
                                    text = if (match.homeScore != null) "${match.homeScore} - ${match.awayScore}" else "VS",
                                    color = if (match.isLive) GreenWin else TextGray,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )

                                // Ekip 2
                                Text(
                                    text = match.awayTeam,
                                    color = TextWhite,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.End,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Liy 3: Bouton Kòt (1, X, 2) avèk weight(1f) sou chak bwat pou pa janm depase
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                listOf(
                                    Triple("1", match.oddHome, "Victoire 1"),
                                    Triple("X", match.oddDraw, "Nul"),
                                    Triple("2", match.oddAway, "Victoire 2")
                                ).forEach { (label, odd, desc) ->
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = DarkBackground,
                                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.25f)),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { /* Chwazi kòt sa */ }
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(vertical = 6.dp, horizontal = 4.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text(
                                                text = label,
                                                color = TextGray,
                                                fontSize = 10.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                text = odd,
                                                color = GoldYellow,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 4. KÈK ESPAS ANBA POU EVITE BLOKE PA BOTTOM BAR
                item {
                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        }
    }
}
