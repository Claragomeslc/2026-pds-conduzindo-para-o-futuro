CREATE DATABASE IF NOT EXISTS conduzindo_futuro;

USE conduzindo_futuro;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    tipo ENUM('ALUNO', 'INSTRUTOR', 'ADMINISTRADOR') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    data_nascimento DATE,
    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE instrutores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    biografia TEXT,
    especialidade VARCHAR(150),
    avaliacao_media DECIMAL(3,2) DEFAULT 0.00,
    CONSTRAINT fk_instrutor_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cargo VARCHAR(100),
    CONSTRAINT fk_administrador_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE disponibilidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instrutor_id INT NOT NULL,
    dia_semana ENUM(
        'SEGUNDA',
        'TERCA',
        'QUARTA',
        'QUINTA',
        'SEXTA',
        'SABADO',
        'DOMINGO'
    ) NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    CONSTRAINT fk_disponibilidade_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    instrutor_id INT NOT NULL,
    data_aula DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status ENUM(
        'PENDENTE',
        'CONFIRMADO',
        'CANCELADO',
        'CONCLUIDO'
    ) DEFAULT 'PENDENTE',
    CONSTRAINT fk_agendamento_aluno
        FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_agendamento_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agendamento_id INT NOT NULL,
    aluno_id INT NOT NULL,
    instrutor_id INT NOT NULL,
    nota INT NOT NULL,
    comentario TEXT,
    data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_avaliacao_agendamento
        FOREIGN KEY (agendamento_id)
        REFERENCES agendamentos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_avaliacao_aluno
        FOREIGN KEY (aluno_id)
        REFERENCES alunos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_avaliacao_instrutor
        FOREIGN KEY (instrutor_id)
        REFERENCES instrutores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_nota
        CHECK (nota >= 1 AND nota <= 5)
);

CREATE TABLE historicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);  