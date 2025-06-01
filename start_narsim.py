import time
import socket
import sys
import struct

# Create a TCP/IP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Connect the socket to the port where the server is listening
server_address = ('194.17.53.68', 7735)
#server_address = ('10.20.30.135', 7783)
print('connecting to {} port {}'.format(*server_address))
sock.connect(server_address)

def send_msg(sock, msg):
    # Prefix each message with a 4-byte length (network byte order)
    msg = struct.pack('>I', len(msg)) + msg
    sock.sendall(msg)

def recv_msg(sock):
    # Read message length and unpack it into an integer
    raw_msglen = recvall(sock, 4)
    if not raw_msglen:
        return None
    msglen = struct.unpack('>I', raw_msglen)[0]
    # Read the message data
    return recvall(sock, msglen)

def recvall(sock, n):
    # Helper function to recv n bytes or return None if EOF is hit
    data = bytearray()
    while len(data) < n:
        packet = sock.recv(n - len(data))
        if not packet:
            return None
        data.extend(packet)
    return data

try:

    # Send data
    message = b'start'
    print('sending {!r}'.format(message))
    send_msg(sock, message)

    print(recv_msg(sock).decode("utf-8"))
    print(recv_msg(sock).decode("utf-8"))

    input("Press Enter to run simulation...")

    message = b'run'
    print('sending {!r}'.format(message))
    send_msg(sock, message)
    print(recv_msg(sock).decode("utf-8"))

    input("Press Enter to stop simulation...")

    message = b'stop'
    print('sending {!r}'.format(message))
    send_msg(sock, message)

    print(recv_msg(sock).decode("utf-8"))
    print(recv_msg(sock).decode("utf-8"))
    print(recv_msg(sock).decode("utf-8"))

    input("Press Enter to exit...")

finally:
    print('closing socket')
    sock.close()