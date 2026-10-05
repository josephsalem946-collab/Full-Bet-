package com.fullbet.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fullbet.app.ui.theme.FullBetSp

// Koulè ofisyèl FULL BET
private val DarkBackground = Color(0xFF0D1322)
private val CardBackground = Color(0xFF151D30)
private val AccentBlue = Color(0xFF1E88E5)
private val TextWhite = Color(0xFFFFFFFF)
private val TextGray = Color(0xFF94A3B8)
private val GreenWin = Color(0xFF4CAF50)

@Composable
fun AmericanRouletteScreenWithExtraOptions(
    onPlaceBet: (stake: Double, option: String) -> Unit = { _, _ -> }
) {
    var betAmount by remember { mutableStateOf(TextFieldValue("")) }
    var selectedOption by remember { mutableStateOf<String?>(null) }

    val rouletteNumbers = listOf("0", "00") + (1..36).map { it.toString() }
    val sideBets = listOf("Red", "Black", "Even", "Odd")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 1. Gwo Tit Ekran an (20.sp dapre gid la)
        Text(
            text = "American Roulette",
            fontSize = FullBetSp.HeaderAppTitle, // 20.sp
            fontWeight = FontWeight.Bold,
            color = TextWhite,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        
        Spacer(modifier = Modifier.height(4.dp))

        // Ti Detay / Subtitle (11.sp a 12.sp)
        Text(
            text = "FULL BET CASINO • ROULETTE 38 CASES",
            fontSize = FullBetSp.SubtitleSmall, // 11.sp
            color = AccentBlue,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(12.dp))

        // 2. Chan pou antre Mis la (Stake)
        OutlinedTextField(
            value = betAmount,
            onValueChange = { betAmount = it },
            label = {
                // Ti Detay (12.sp)
                Text(
                    text = "Kantite Pari an HTG (Stake)",
                    fontSize = FullBetSp.SubtitleStatus, // 12.sp
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AccentBlue,
                unfocusedBorderColor = CardBackground,
                focusedLabelColor = AccentBlue,
                cursorColor = TextWhite,
                focusedContainerColor = CardBackground,
                unfocusedContainerColor = CardBackground
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Tèks enfòmasyon sou sa ki chwazi a (12.sp)
        Text(
            text = if (selectedOption != null) "Opsyon chwazi: $selectedOption" else "Chwazi yon nimewo oswa yon opsyon",
            fontSize = FullBetSp.SubtitleStatus, // 12.sp
            color = TextGray,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(10.dp))

        // 3. Bouton Opsyon Siplemantè yo (Red / Black / Even / Odd)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            sideBets.forEach { bet ->
                val isSelected = selectedOption == bet
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp)
                        .background(
                            color = if (isSelected) AccentBlue else CardBackground,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = if (isSelected) TextWhite else AccentBlue.copy(alpha = 0.3f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        .clickable { selectedOption = bet },
                    contentAlignment = Alignment.Center
                ) {
                    // Ti Detay / Subtitles (12.sp) pou bouton opsyon rapid
                    Text(
                        text = bet,
                        fontSize = FullBetSp.SubtitleStatus, // 12.sp
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // 4. Grid pou tout nimewo yo (0, 00, ak 1-36)
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(rouletteNumbers) { number ->
                val isSelected = selectedOption == number
                Box(
                    modifier = Modifier
                        .height(44.dp)
                        .background(
                            color = if (isSelected) AccentBlue else CardBackground,
                            shape = RoundedCornerShape(8.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = if (isSelected) TextWhite else AccentBlue.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        .clickable { selectedOption = number },
                    contentAlignment = Alignment.Center
                ) {
                    // Tit pou Modèl yo / Card Titles (14.sp dapre gid la)
                    Text(
                        text = number,
                        fontSize = FullBetSp.CardGameTitle, // 14.sp
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Ti nòt / Captions (10.sp dapre gid la)
        Text(
            text = "Règ: 0 ak 00 se pou bank la • Peman nimewo senp: 35x",
            fontSize = FullBetSp.CaptionNote, // 10.sp
            color = TextGray,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 5. Bouton Valide Pari a (Tèks Nòmal / Body 16.sp)
        Button(
            onClick = {
                val stake = betAmount.text.toDoubleOrNull() ?: 0.0
                selectedOption?.let { option ->
                    if (stake > 0) {
                        onPlaceBet(stake, option)
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = GreenWin),
            shape = RoundedCornerShape(8.dp)
        ) {
            // Tèks Nòmal / Body (16.sp dapre gid la)
            Text(
                text = "Mete Pari a",
                fontSize = FullBetSp.BodyRegular, // 16.sp
                fontWeight = FontWeight.Bold,
                color = TextWhite,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
