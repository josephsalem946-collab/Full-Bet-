package com.fullbet.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Lock
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
// KOULÈ AK TÈM OFISYÈL FULL BET LA
// =========================================================================
private val DarkBackground = Color(0xFF0D1322)
private val CardBackground = Color(0xFF151D30)
private val AccentBlue = Color(0xFF1E88E5)
private val TextWhite = Color(0xFFFFFFFF)
private val TextGray = Color(0xFF94A3B8)
private val GreenWin = Color(0xFF4CAF50)
private val RedNotification = Color(0xFFE53935)
private val GoldYellow = Color(0xFFFFB300)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FullBetMaskedSymbolsScreen(
    onNavigateBack: () -> Unit = {},
    onOpenWalletDeposit: () -> Unit = {},
    onOpenWalletWithdraw: () -> Unit = {}
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var selectedModule by remember { mutableStateOf("Paris Sportifs") }
    var isMasked by remember { mutableStateOf(true) }

    // RÈGLE 3: Pas de largeur rigide sur l'écran global ou les conteneurs de texte
    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = DarkBackground,
                modifier = Modifier
                    .fillMaxHeight()
                    .widthIn(max = 340.dp)
                    .fillMaxWidth(0.85f)
            ) {
                // RÈGLE 4: verticalScroll pou tout kontni meni an pa janm koupe
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    // TÈT MENI AN (HEADER)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // RÈGLE 2: weight(1f) pou tit la pa janm debòde sou bouton fèmen an
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
                                // RÈGLE 1: maxLines = 1 ak TextOverflow.Ellipsis
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

                        IconButton(
                            onClick = { scope.launch { drawerState.close() } },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Text(text = "✕", color = TextWhite, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // KAT PWOFIL ITILIZATÈ (MASKE)
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = CardBackground,
                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.3f)),
                        // RÈGLE 3: fillMaxWidth olye de largeur fixe dp
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = AccentBlue,
                                    modifier = Modifier.size(40.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(text = "JB", color = TextWhite, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))

                                // RÈGLE 2: weight(1f) sou kolòn non ak enfòmasyon itilizatè a
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(end = 6.dp)
                                ) {
                                    Text(
                                        text = if (isMasked) "Jean-Baptiste Pie••••" else "Jean-Baptiste Pierre-Louis",
                                        color = TextWhite,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        // RÈGLE 1: maxLines = 1 ak TextOverflow.Ellipsis
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = Color(0xFF2E7D32)
                                        ) {
                                            Text(
                                                text = "18+",
                                                color = TextWhite,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                            )
                                        }
                                        Text(
                                            text = if (isMasked) "+509 •••• ••••" else "+509 3215 3281",
                                            color = TextGray,
                                            fontSize = 11.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }

                                // Bouton baskil masquage
                                IconButton(
                                    onClick = { isMasked = !isMasked },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Text(text = if (isMasked) "👁️" else "🔒", fontSize = 14.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))
                            Divider(color = AccentBlue.copy(alpha = 0.2f), thickness = 0.8.dp)
                            Spacer(modifier = Modifier.height(10.dp))

                            // Liy Solde ak Bouton Aksyon yo
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // RÈGLE 2: weight(1f) sou tèks solde pou li pa pouse bouton yo deyò
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(end = 6.dp)
                                ) {
                                    Text(
                                        text = "SOLDE TOTAL",
                                        color = TextGray,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = if (isMasked) "•••••• HTG" else "12,500.00 HTG",
                                        color = GreenWin,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Button(
                                        onClick = {
                                            scope.launch { drawerState.close() }
                                            onOpenWalletDeposit()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = GreenWin),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text(text = "Dépôt", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            scope.launch { drawerState.close() }
                                            onOpenWalletWithdraw()
                                        },
                                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.5f)),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text(text = "Retrè", color = AccentBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // SEKSYON ENFÒMASYON MASKE (DÉTAILS COMPTE)
                    Text(
                        text = "ENFÒMASYON SOU KONT (PWOTEJE)",
                        color = TextGray,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)
                    )

                    val accountDetails = listOf(
                        Pair("Nimewo Idantifikasyon", if (isMasked) "ID: •••••••• 946" else "ID: 856675755931"),
                        Pair("Kont Natcash Lye", if (isMasked) "+509 32•• ••81" else "+509 3215 3281"),
                        Pair("Kont Moncash Lye", if (isMasked) "+509 47•• ••89" else "+509 4771 6289"),
                        Pair("Imèl Sekirize", if (isMasked) "j•••••••••946@gmail.com" else "josephsalem946@gmail.com")
                    )

                    accountDetails.forEach { (label, value) ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = CardBackground,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = label,
                                    color = TextGray,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = value,
                                    color = TextWhite,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.End,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    ) {
        // KÒ EKRAN AN (BODY)
        Scaffold(
            containerColor = DarkBackground,
            topBar = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CardBackground)
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { scope.launch { drawerState.open() } },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(Icons.Default.Menu, contentDescription = "Meni", tint = TextWhite)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // RÈGLE 2: weight(1f) pou tit la
                    Text(
                        text = "FULL BET • MASKE & SEKIRITE",
                        color = TextWhite,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    IconButton(
                        onClick = { isMasked = !isMasked },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Text(text = if (isMasked) "👁️" else "🔒", fontSize = 16.sp)
                    }
                }
            }
        ) { paddingValues ->
            // RÈGLE 4: LazyColumn pou evite nenpòt debòdman sou tout telefòn
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
            ) {
                item {
                    // Banner enfòmasyon sekirite
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = CardBackground,
                        border = BorderStroke(1.dp, AccentBlue.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "🛡️", fontSize = 24.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Mòd Masquage Aktif",
                                    color = TextWhite,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Enfòmasyon sansib ou yo pwoteje kont je kirye.",
                                    color = TextGray,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Lis kat tranzaksyon resan avèk weight(1f) ak maxLines = 1
                item {
                    Text(
                        text = "DÈNYE TRANZAKSYON YO",
                        color = TextGray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                val recentTx = listOf(
                    Triple("Dépôt Moncash", "Jodi a, 14:22", "+2,500 HTG"),
                    Triple("Pari Genyen (Real Madrid)", "Hier, 21:45", "+7,800 HTG"),
                    Triple("Retrait Natcash", "24 Sept, 10:15", "-5,000 HTG"),
                    Triple("Borlette New York Midi", "23 Sept, 12:30", "-250 HTG")
                )

                items(recentTx.size) { index ->
                    val (title, date, amount) = recentTx[index]
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = CardBackground,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(end = 8.dp)
                            ) {
                                Text(
                                    text = title,
                                    color = TextWhite,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = date,
                                    color = TextGray,
                                    fontSize = 10.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            Text(
                                text = if (isMasked) "••••••" else amount,
                                color = if (amount.startsWith("+")) GreenWin else Color(0xFFFF7043),
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
