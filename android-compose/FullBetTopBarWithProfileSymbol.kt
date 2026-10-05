package com.fullbet.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fullbet.app.ui.theme.FullBetSp

// Koulè tèm aplikasyon FULL BET
private val DarkBackground = Color(0xFF0D1322)
private val CardBackground = Color(0xFF151D30)
private val AccentBlue = Color(0xFF1E88E5)
private val TextWhite = Color(0xFFFFFFFF)
private val GreenWin = Color(0xFF4CAF50)

/**
 * TopBar FULL BET ak gid tipografi:
 * - 20.sp : Gwo Tit (FULL BET)
 * - 14.sp : Tit pou kat / Solde montan
 * - 11.sp a 12.sp : Ti Detay / Subtitles
 * - 10.sp : Trè Ti Tèks / Captions
 */
@Composable
fun FullBetTopBarWithProfileSymbol(
    balance: String = "12 500 HTG",
    useRealLogoImage: Boolean = true,
    onLogoClick: () -> Unit = {},
    onWalletClick: () -> Unit = {},
    onProfileClick: () -> Unit = {},
    showTitleText: Boolean = false,
    modifier: Modifier = Modifier
) {
    var isMasked by remember { mutableStateOf(false) }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkBackground)
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 1. Pati Gòch: Logo (oswa senbòl FB)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = if (showTitleText) Modifier.weight(1f).clickable { onLogoClick() } else Modifier.clickable { onLogoClick() }
        ) {
            if (useRealLogoImage) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(CardBackground)
                        .border(1.2.dp, AccentBlue, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = com.fullbet.app.R.drawable.full_bet_logo),
                        contentDescription = "Logo Full Bet",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                Surface(
                    shape = CircleShape,
                    color = AccentBlue,
                    modifier = Modifier.size(40.dp),
                    border = BorderStroke(1.dp, TextWhite.copy(alpha = 0.5f))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = "FB",
                            color = TextWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = FullBetSp.CardGameTitle // 14.sp
                        )
                    }
                }
            }

            if (showTitleText) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 4.dp)
                ) {
                    // Gwo Tit (20.sp a 24.sp)
                    Text(
                        text = "FULL BET",
                        color = TextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = FullBetSp.HeaderAppTitle, // 20.sp
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    // Trè Ti Tèks / Captions (10.sp)
                    Text(
                        text = "PARIS • CASINO • BORLETTE",
                        color = AccentBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = FullBetSp.CaptionNote, // 10.sp
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // 2. Pati Adwat: Solde du compte (12 500 HTG) + Senbòl ki reprezante profil kliyan an
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Solde du compte (14.sp - Card Title / Solde)
            Surface(
                onClick = {
                    isMasked = !isMasked
                    onWalletClick()
                },
                shape = RoundedCornerShape(16.dp),
                color = CardBackground,
                border = BorderStroke(1.dp, AccentBlue)
            ) {
                Text(
                    text = if (isMasked) "•••• HTG" else balance,
                    color = GreenWin,
                    fontSize = FullBetSp.CardGameTitle, // 14.sp
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Senbòl pwofil (16.sp)
            IconButton(
                onClick = onProfileClick,
                modifier = Modifier
                    .size(40.dp)
                    .background(CardBackground, shape = CircleShape)
                    .border(1.dp, AccentBlue.copy(alpha = 0.5f), CircleShape)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "👤",
                        fontSize = FullBetSp.BodyRegular // 16.sp
                    )
                }
            }
        }
    }
}
