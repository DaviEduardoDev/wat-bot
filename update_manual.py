import os

file_path = 'd:/Code Projects/wat-bot/public/index.html'

new_manual_content = """                    <div class="card p-4">
                        <h4 class="mb-4">📖 Manual do Usuário</h4>
                        
                        <!-- Protocolo de Segurança -->
                        <div class="alert alert-warning">
                            <strong>⚠️ Protocolo de Segurança (LEIA COM ATENÇÃO)</strong><br>
                            Para manter seu número seguro e evitar banimentos pelo WhatsApp, siga rigorosamente estas regras:
                            <br><br>
                            <strong>1. Regra do "Aquecimento" (Para chips novos ou parados)</strong><br>
                            Não envie muitas mensagens de uma vez se você nunca usou robô antes. Siga este cronograma:<br>
                            - Dia 1: Máximo 30 mensagens.<br>
                            - Dia 2: Máximo 50 mensagens.<br>
                            - Dia 3: Máximo 80 mensagens.<br>
                            - Dia 4 em diante: Pode aumentar gradualmente, mas recomendamos manter entre 300 a 500 mensagens por dia no máximo.
                            <br><br>
                            <strong>2. Velocidade de Envio</strong><br>
                            O sistema foi programado propositalmente para ser "lento". Ele envia uma mensagem a cada 15 a 40 segundos.<br>
                            Não estranhe a demora: Isso imita o comportamento humano.<br>
                            Nunca tente acelerar: Velocidade alta = Bloqueio imediato.
                            <br><br>
                            <strong>3. Interação Humana (O Segredo)</strong><br>
                            O WhatsApp gosta de ver conversas reais.<br>
                            Se um cliente responder à promoção, pare o robô (ou espere acabar) e converse com ele manualmente.<br>
                            Quanto mais gente responder "Eu quero" ou "Obrigado", mais forte fica a reputação do seu número.
                        </div>

                        <hr>

                        <h5>1. Iniciando o Sistema</h5>
                        <ol>
                            <li>Dê um duplo clique no arquivo executável ou atalho do sistema.</li>
                            <li>Uma janela preta (terminal) se abrirá. <strong>Não feche essa janela</strong>, ela é o motor do sistema.</li>
                            <li>O navegador abrirá automaticamente com o painel de controle. Se não abrir, digite <code>http://localhost:3000</code> no seu navegador.</li>
                        </ol>

                        <hr>

                        <h5>2. Conectando ao WhatsApp</h5>
                        <ol>
                            <li>Na tela inicial, digite o número do WhatsApp que fará os envios (Ex: <code>11999999999</code>).</li>
                            <li>Clique em <strong>"Gerar Código de Conexão"</strong>.</li>
                            <li>O sistema gerará um código de 8 letras/números.</li>
                            <li>No seu celular:
                                <ul>
                                    <li>Abra o WhatsApp.</li>
                                    <li>Vá em <strong>Configurações</strong> (ou três pontinhos) > <strong>Aparelhos Conectados</strong>.</li>
                                    <li>Toque em <strong>Conectar um aparelho</strong>.</li>
                                    <li>Toque na opção <strong>"Conectar com número de telefone"</strong>.</li>
                                    <li>Digite o código exibido no painel do WatBot.</li>
                                </ul>
                            </li>
                            <li>Aguarde a conexão. O painel mudará para a tela de disparos.</li>
                        </ol>

                        <hr>

                        <h5>3. Selecionando Contatos</h5>
                        <p>Diferente de versões anteriores, agora você não precisa de planilhas Excel. O sistema busca seus contatos diretamente da agenda.</p>
                        <ol>
                            <li>Clique no botão azul <strong>"📂 Carregar Contatos do WhatsApp"</strong>.</li>
                            <li>Aguarde alguns segundos (pode demorar se você tiver muitos contatos).</li>
                            <li>Uma lista aparecerá com todos os seus contatos válidos.</li>
                            <li><strong>Filtrar:</strong> Use o campo de busca "Filtrar por nome..." para encontrar pessoas específicas.</li>
                            <li><strong>Selecionar:</strong>
                                <ul>
                                    <li>Marque a caixinha ao lado de cada nome.</li>
                                    <li>Ou marque a opção <strong>"Selecionar Todos"</strong> para escolher todos da lista atual.</li>
                                    <li>O contador mostrará quantos contatos estão selecionados.</li>
                                </ul>
                            </li>
                        </ol>

                        <hr>

                        <h5>4. Configurando o Envio</h5>
                        <ol>
                            <li><strong>Mídia (Opcional):</strong> Se quiser enviar uma foto, vídeo ou áudio, clique em "Escolher arquivo".
                                <br><em>Dica: Áudios enviados aqui chegarão como se tivessem sido gravados na hora!</em>
                            </li>
                            <li><strong>Agendamento (Opcional):</strong> Se quiser enviar mais tarde, escolha a data e hora.</li>
                            <li><strong>Mensagem:</strong> Digite o texto da sua promoção ou aviso.
                                <br>Use os botões <strong>B</strong>, <em>I</em>, S para formatar.
                            </li>
                        </ol>

                        <hr>

                        <h5>5. Iniciando os Disparos</h5>
                        <ol>
                            <li>Clique no botão verde <strong>"INICIAR 🚀"</strong>.</li>
                            <li><strong>Acompanhe:</strong>
                                <ul>
                                    <li>A barra de progresso mostrará a porcentagem concluída.</li>
                                    <li>O "Log de Atividades" mostrará o que está acontecendo em tempo real.</li>
                                </ul>
                            </li>
                            <li><strong>Pausar:</strong> Se precisar interromper momentaneamente, clique em "PAUSAR".</li>
                            <li><strong>Parar:</strong> O botão "PARAR" cancela totalmente o envio restante.</li>
                        </ol>

                        <hr>

                        <h5>6. Relatórios</h5>
                        <p>Ao final de cada campanha, um link <strong>"Baixar CSV"</strong> aparecerá. Clique nele para baixar uma planilha contendo:</p>
                        <ul>
                            <li>Quem recebeu.</li>
                            <li>Quem falhou.</li>
                            <li>Horário do envio.</li>
                        </ul>
                        <p>Você também pode acessar o histórico de campanhas passadas na aba <strong>"📊 Dashboard"</strong>.</p>

                        <hr>

                        <h5>Dicas de Segurança (Anti-Bloqueio)</h5>
                        <ul>
                            <li><strong>Não faça SPAM:</strong> Evite enviar mensagens para pessoas que não conhecem sua empresa.</li>
                            <li><strong>Respeite o Delay:</strong> O sistema espera entre 15 a 40 segundos entre cada mensagem.</li>
                            <li><strong>Aqueça o Chip:</strong> Se o número for novo, comece enviando poucas mensagens por dia.</li>
                        </ul>
                    </div>"""

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<div class="tab-pane fade" id="pills-manual" role="tabpanel">'
end_marker = '<!-- Socket.io Client -->'

# Find the start of the manual section
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
    exit(1)

# Find the end of the manual section (it ends before the closing div of the tab-content or similar)
# Looking at the file structure:
# <div class="tab-pane fade" id="pills-manual" role="tabpanel">
#    ... content ...
# </div>
# </div> <!-- End of tab-content -->
# </div> <!-- End of container -->
# </div> <!-- End of container py-3 -->

# We can find the closing div of the manual tab.
# Since we know the content inside, let's look for the next closing div after the start marker.
# But simpler: we know the manual tab is the last tab.
# It is followed by closing divs for tab-content, etc.

# Let's look for the specific content we want to replace.
# The old content starts with <div class="card p-4"> and ends with </div>.
# It is inside the tab-pane.

inner_start_marker = '<div class="card p-4">'
inner_end_marker = '</div>'

# We need to be careful because there are many divs.
# Let's find the start of the manual tab, then find the first <div class="card p-4"> after that.
manual_tab_start = content.find(start_marker)
card_start = content.find(inner_start_marker, manual_tab_start)

# Now we need to find the matching closing div for this card.
# Since the card content is indented, we can try to find the closing div based on context or just count divs.
# Or, since we know what the old content looks like (it ends with "Clique em <strong>"INICIAR 🚀"</strong> e acompanhe o progresso.\n                        </p>\n                    </div>"), we can search for that.

# Actually, let's just replace everything inside the tab-pane.
# The tab-pane starts at manual_tab_start.
# The next line is the card start.
# The tab-pane closes with a </div>.

# Let's find the position of the next <div class="tab-pane" ...> or the end of the tab-content.
# But this is the last tab. So it is followed by </div> (end of tab-content).

# Let's try to find the closing div of the tab-pane.
# It is indented.
# <div class="tab-pane fade" id="pills-manual" role="tabpanel">
#     CONTENT
# </div>

# We can search for the next </div> that is at the same indentation level? No, that's hard with raw string.

# Let's use the fact that we know the exact previous content from the view_file.
# It ends with:
#                         <p>
#                             Clique em <strong>"INICIAR 🚀"</strong> e acompanhe o progresso.
#                         </p>
#                     </div>
#                 </div>

# So we can search for that string.
old_end_string = """                        <p>
                            Clique em <strong>"INICIAR 🚀"</strong> e acompanhe o progresso.
                        </p>
                    </div>"""

end_idx = content.find(old_end_string)
if end_idx == -1:
    # Try with different whitespace if copy-paste failed
    print("End marker not found, trying fuzzy match")
    # Fallback: Find the last </div> inside the manual tab area.
    pass

# Alternative: We know the manual tab is followed by `</div>` (end of tab-content) and then `</div>` (end of something else).
# Let's look for the start of the manual tab, and then the next occurrence of `</div>\n            </div>` which marks the end of the tab-content.

# In the file:
# 330: <div class="tab-pane fade" id="pills-manual" role="tabpanel">
# ...
# 392:                 </div>
# 393:             </div>

# So we want to replace from line 331 to 391.
# We can split by lines.
lines = content.split('\n')
# Line 330 is index 330 (0-indexed) -> actually line 1 is index 0. So line 331 is index 330.
# Wait, view_file said "Showing lines 1 to 761".
# So line 331 is index 330.
# Line 391 is index 390.

# Let's verify line 330 content.
if 'id="pills-manual"' in lines[329]: # Line 330
    print("Found manual tab at line 330")
    start_line_idx = 330 # This is the line with the tab-pane div. We want to keep it.
    # The content starts at 331 (index 330)
    
    # Check line 392 (index 391) -> should be </div>
    # Check line 393 (index 392) -> should be </div>
    
    # We want to replace lines 330 to 390 (inclusive) with the new content?
    # No, we want to replace lines 331 to 391.
    # Line 331 is index 330.
    # Line 391 is index 390.
    
    # Let's check the content of lines[330] (Line 331)
    # It should be <div class="card p-4">
    if 'class="card p-4"' in lines[330]:
        print("Found card start at line 331")
    else:
        print(f"Expected card start at 331, found: {lines[330]}")
        exit(1)

    # Let's check the content of lines[390] (Line 391)
    # It should be </div>
    if '</div>' in lines[390]:
        print("Found card end at line 391")
    else:
        print(f"Expected card end at 391, found: {lines[390]}")
        # It might be slightly off.
        exit(1)
        
    # Replace lines 330 to 390 (inclusive) with new_manual_content
    # But new_manual_content is a string, we need to split it or insert it.
    
    new_lines = lines[:330] + [new_manual_content] + lines[391:]
    
    new_content = '\n'.join(new_lines)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated index.html")

else:
    print("Could not find manual tab at expected line")
    exit(1)
